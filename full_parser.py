import re
import sys
import glob
import time
from datetime import datetime
from math import radians, cos, sin, asin, sqrt
import os
import pandas as pd
import openpyxl
import psycopg2
import psycopg2.extras
from psycopg2.extras import execute_values
from multiprocessing import Pool, cpu_count
from config import DB_CONFIG



MODEL_NORMALIZATION = {
    "DJIPHANTOM4PRO": "DJI PHANTOM 4 PRO",
    "DJIPHANTOM4": "DJI PHANTOM 4",
    "DJIMINI3PRO": "DJI MINI 3 PRO",
    "DJIMINI4PRO": "DJI MINI 4 PRO",
    "DJIMAVIC3": "DJI MAVIC 3",
    "DJIMAVIC3PRO": "DJI MAVIC 3 PRO",
    "DJIMAVIC3CLASSIC": "DJI MAVIC 3 CLASSIC",
    "GEOSCAN201": "GEOSCAN 201",
    "DJIMATRICE300": "DJI MATRICE 300",
    "DJIMATRICE30T": "DJI MATRICE 30T"
}

def normalize_model(model: str) -> str:
    if not model:
        return model
    key = model.upper().replace(" ", "")
    return MODEL_NORMALIZATION.get(key, model.strip())

def parse_record(row):
    center = str(row["center"] or "")
    shr = str(row["shr"] or "")
    dep = str(row["dep"] or "")
    arr = str(row["arr"] or "")
    return ShrDepArrParser.parse(center, shr, dep, arr)


def parse_chunk(chunk):
    return [parse_record(r) for _, r in chunk.iterrows()]


def parse_coords(coord_str):
    if not coord_str:
        return None

    coord_str = str(coord_str).strip()

    coord_str = (coord_str
                .replace('С', 'N')  # Север - North
                .replace('Ю', 'S')  # Юг - South
                .replace('В', 'E')  # Восток - East
                .replace('З', 'W')) # Запад - West


    m = re.match(r"^(\d{2})(\d{2})(\d{2})([NS])(\d{3})(\d{2})(\d{2})([EW])$", coord_str)
    if m:
        lat_deg, lat_min, lat_sec, lat_hem, lon_deg, lon_min, lon_sec, lon_hem = m.groups()
        lat = int(lat_deg) + int(lat_min) / 60 + int(lat_sec) / 3600
        lon = int(lon_deg) + int(lon_min) / 60 + int(lon_sec) / 3600
    else:

        m = re.match(r"^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])$", coord_str)
        if not m:

            print(f"Не удалось распознать координаты: {coord_str}")
            return None
        lat_deg, lat_min, lat_hem, lon_deg, lon_min, lon_hem = m.groups()
        lat = int(lat_deg) + int(lat_min) / 60.0
        lon = int(lon_deg) + int(lon_min) / 60.0

    if lat_hem == "S":
        lat = -lat
    if lon_hem == "W":
        lon = -lon

    return lon, lat


def parse_datetime(date_str, time_str):
    if not date_str or not time_str:
        return None
    try:
        return datetime.strptime(str(date_str) + str(time_str), "%y%m%d%H%M")
    except Exception:
        return None


def haversine(lon1, lat1, lon2, lat2):
    R = 6371.0
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))




class ShrDepArrParser:
    @staticmethod
    def parse(center, shr, dep, arr):
        r = {
            "sid": None,
            "date": None,
            "departureTime": None,
            "arrivalTime": None,
            "operator": None,
            "aircraftType": None,
            "aircraftModel": None,
            "status": None,
            "departureCoords": None,
            "arrivalCoords": None,
            "remarks": None,
            "sourceCenter": None,
            "phones": [],
            "remarksRaw": None,
            "rawMessage": None,
            "regNumbers": []
        }

        r["sourceCenter"] = center
        shrRaw = shr or ""
        depRaw = dep or ""
        arrRaw = arr or ""
        r["rawMessage"] = (shrRaw + " " + depRaw + " " + arrRaw).strip()

        shrN = ShrDepArrParser._normalize_text(shrRaw)
        depN = ShrDepArrParser._normalize_text(depRaw)
        arrN = ShrDepArrParser._normalize_text(arrRaw)

        # --- SHR ---
        if shrN and shrN.strip():
            r["sid"] = ShrDepArrParser._match(r"SID/(\d+)", shrN, r["sid"])
            r["date"] = ShrDepArrParser._match(r"DOF/(\d{6})", shrN, r["date"])
            r["departureTime"] = ShrDepArrParser._match(r"ZZZZ(\d{4})", shrN, r["departureTime"])
            r["departureCoords"] = ShrDepArrParser._match(r"DEP/(\S+)", shrN, r["departureCoords"])
            r["arrivalCoords"] = ShrDepArrParser._match(r"DEST/(\S+)", shrN, r["arrivalCoords"])

            rawType = ShrDepArrParser._match(r"TYP/(\S+)", shrN, None)
            if rawType:
                # тип = только буквы
                cleaned = re.sub(r"[^A-ZА-ЯЁ]", "", rawType, flags=re.IGNORECASE)
                r["aircraftType"] = cleaned if cleaned else r["aircraftType"]

            r["status"] = ShrDepArrParser._match(r"STS/(\S+)", shrN, r["status"])

            r["operator"] = ShrDepArrParser._extract_operator_from_opr(shrN, r["operator"])

            rawRemarks = ShrDepArrParser._match(
                r"RMK/(.+?)(?=\s+(?:SID/|\-SID\b|REG/|TYP/|STS/|DOF/|DEP/|DEST/|TEL/|TIP/|TYPE/|$))",
                shrN, None
            )
            if rawRemarks:
                ShrDepArrParser._parse_remarks(rawRemarks, r)


        if depN and depN.strip():
            r["sid"] = ShrDepArrParser._match(r"SID\s+(\d+)", depN, r["sid"])
            r["date"] = ShrDepArrParser._match(r"ADD\s+(\d{6})", depN, r["date"])
            r["departureTime"] = ShrDepArrParser._match(r"ATD\s+(\d{4})", depN, r["departureTime"])
            r["departureCoords"] = ShrDepArrParser._match(r"ADEPZ\s+(\S+)", depN, r["departureCoords"])


        if arrN and arrN.strip():
            r["sid"] = ShrDepArrParser._match(r"SID\s+(\d+)", arrN, r["sid"])
            r["date"] = ShrDepArrParser._match(r"ADA\s+(\d{6})", arrN, r["date"])
            r["arrivalTime"] = ShrDepArrParser._match(r"ATA\s+(\d{4})", arrN, r["arrivalTime"])
            r["arrivalCoords"] = ShrDepArrParser._match(r"ADARRZ\s+(\S+)", arrN, r["arrivalCoords"])


        ShrDepArrParser._extract_reg_numbers(shrRaw, r)
        ShrDepArrParser._extract_reg_numbers(depRaw, r)
        ShrDepArrParser._extract_reg_numbers(arrRaw, r)


        ShrDepArrParser._extract_aircraft_model(shrRaw + " " + depRaw + " " + arrRaw, r)

        return r



    @staticmethod
    def _match(regex, text, current):
        if text is None:
            return current
        m = re.search(regex, text, flags=re.DOTALL | re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            return ShrDepArrParser._normalize_text(val)
        return current

    @staticmethod
    def _normalize_text(text):
        if text is None:
            return None
        t = str(text).replace("\n", " ")
        t = re.sub(r"\s+", " ", t).strip()
        # исправляем OCR "4" -> "Ч" в разных контекстах (как в Java)
        # учитываем кириллические буквы и букву Ё
        try:
            t = re.sub(r"(?<=[А-ЯЁа-яё])4(?=[А-ЯЁа-яё])", "Ч", t)
            t = re.sub(r"(?<=[А-ЯЁа-яё])4(?=\b|[^0-9])", "Ч", t)
            t = re.sub(r"(?<=\b|[^0-9])4(?=[А-ЯЁа-яё])", "Ч", t)
        except re.error:
            # на некоторых старых интерпретаторах lookbehind для кириллицы может упасть — игнорируем тогда
            pass
        return t

    @staticmethod
    def _extract_operator_from_opr(text, current):
        if not text:
            return current
        p = re.compile(
            r"OPR/\s*([A-Za-zА-ЯЁа-яё\-\.\s]+?)(?=\s+(?:\+?\d|TEL\b|TYP/|REG/|STS/|RMK/|SID/|DOF/|DEP/|DEST/|$))",
            flags=re.IGNORECASE
        )
        m = p.search(text)
        if m:
            name = m.group(1).strip()
            name = re.sub(r"\s+", " ", name)
            name = re.sub(r"^(?:БВС|БПЛА)\s+", "", name, flags=re.IGNORECASE)
            return ShrDepArrParser._merge_semi(current, name)
        return current

    @staticmethod
    def _parse_remarks(text, r):
        t = ShrDepArrParser._normalize_text(text) or ""

        # 1) Телефоны (+7..., 8...)
        for ph in re.finditer(r"(?:\+7|8)\d{10}", t):
            r["phones"].append(ph.group())

        tel_re = re.compile(r"\bTEL\s*/?\s*((?:\+7|8)?\d{10})", flags=re.IGNORECASE)
        for ph in tel_re.finditer(t):
            r["phones"].append(ph.group(1))

        # 2) Оператор внутри RMK
        ShrDepArrParser._extract_operators_from_free_text(t, r)

        # 3) Коды согласований
        for code in re.finditer(r"\b(?:WR|МР)\d+\b", t):
            if r["remarks"] is None:
                r["remarks"] = ""
            if code.group() not in (r["remarks"] or ""):
                r["remarks"] += ("" if not r["remarks"] else "; ") + code.group()

        # 4) Остаток RMK без телефонов/TEL — в remarksRaw
        clean = re.sub(r"(?:\+7|8)\d{10}", "", t)
        clean = re.sub(r"\bTEL\s*/?\s*((?:\+7|8)?\d{10})", "", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s+", " ", clean).strip()
        if clean:
            if not r.get("remarksRaw"):
                r["remarksRaw"] = clean
            else:
                r["remarksRaw"] = (r["remarksRaw"] + " " + clean).strip()

    @staticmethod
    def _extract_operators_from_free_text(t, r):
        trigger = re.compile(r"(?:\bOPR/|\bFIO/|\bОПЕРАТОР\b|\bПИЛОТ\b|\bOPERATOR\b)", flags=re.IGNORECASE)
        for m in trigger.finditer(t):
            start = m.end()
            tail = t[start:].strip()

            next_field = re.compile(r"\b(?:REG/?|TYP/|STS/|RMK/|SID/|DOF/|DEP/|DEST/|TEL/|TIP/|TYPE/|OPR/|FIO/|ОПЕРАТОР|ПИЛОТ|OPERATOR)\b",
                                    flags=re.IGNORECASE)
            n = next_field.search(tail)
            if n:
                tail = tail[:n.start()].strip()

            tail = re.sub(r"\b(БВС|БПЛА|UAV|DRONE)\b", " ", tail, flags=re.IGNORECASE)
            tail = re.sub(r"\s+", " ", tail).strip()

            found = False

            fio_cyr = re.compile(r"([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){0,2})")
            for fm in fio_cyr.finditer(tail):
                r["operator"] = ShrDepArrParser._merge_semi(r.get("operator"), fm.group(1).strip())
                found = True


            fio_lat = re.compile(r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|[A-Z]{2,}(?:\s+[A-Z]{2,}){0,2})")
            for fm in fio_lat.finditer(tail):
                r["operator"] = ShrDepArrParser._merge_semi(r.get("operator"), fm.group(1).strip())
                found = True


    @staticmethod
    def _extract_reg_numbers(raw, r):
        if not raw or not str(raw).strip():
            return

        scan = str(raw)
        scan = scan.replace('\u00A0', ' ').replace('\u2007', ' ').replace('\u202F', ' ')
        scan = re.sub(r"[ \t\x0B\f\r\n]+", " ", scan).strip()

        stopPattern = re.compile(r"[А-ЯЁA-Z]4[А-ЯЁA-Z]", flags=re.IGNORECASE)
        stopList = {
            "КРАВ4УК",
            "У4ЕТНЫЕ",
            "4УМАКОВ",
            "ПО4ИНОВ"
        }
        def notBlocked(t):
            if stopPattern.search(t):
                return False
            if t.upper() in stopList:
                return False
            return True

        # 1) REG/AAA, REG AAA, REGAAA (+ списки через запятую)
        p1 = re.compile(r"\bREG\s*/?\s*([A-ZА-ЯЁ0-9\-,]+)", flags=re.IGNORECASE)
        for m in p1.finditer(scan):
            blob = m.group(1)
            for token in blob.split(","):
                tkn = re.sub(r"^REG", "", token, flags=re.IGNORECASE)
                tkn = tkn.lstrip("/").strip()
                if re.fullmatch(r"[A-ZА-ЯЁ0-9\-]{3,}", tkn, flags=re.IGNORECASE) and ShrDepArrParser._looks_like_reg(tkn) and notBlocked(tkn):
                    ShrDepArrParser._add_reg_unique(r, tkn)

        # 2) номера рядом с БЛА/БПЛА
        p3 = re.compile(
            r"\b(?:БЛА|БПЛА)\b[ \t\x0B\f\r\n\u00A0\u2007\u202F]*"
            r"(?:№|No\.?|N\.?|#)?[ \t\x0B\f\r\n\u00A0\u2007\u202F]*"
            r"([A-ZА-ЯЁ0-9\-]{3,})",
            flags=re.IGNORECASE | re.UNICODE
        )
        for m in p3.finditer(scan):
            tkn = m.group(1).strip()
            if re.fullmatch(r"[A-ZА-ЯЁ0-9\-]{3,}", tkn, flags=re.IGNORECASE) and ShrDepArrParser._looks_like_reg(tkn) and notBlocked(tkn):
                ShrDepArrParser._add_reg_unique(r, tkn)

        # 3) редкие формы "REG00725" без пробела и слэша
        p2 = re.compile(r"\bREG([A-ZА-ЯЁ0-9\-]{3,})\b", flags=re.IGNORECASE)
        for m in p2.finditer(scan):
            tkn = m.group(1).strip()
            if re.fullmatch(r"[A-ZА-ЯЁ0-9\-]{3,}", tkn, flags=re.IGNORECASE) and ShrDepArrParser._looks_like_reg(tkn) and notBlocked(tkn):
                ShrDepArrParser._add_reg_unique(r, tkn)

        # 4) fallback — 6–7 знаков (буквы+цифры)
        p4 = re.compile(r"(?<!\w)(?=[A-ZА-ЯЁ0-9]*[A-ZА-ЯЁ])(?=[A-ZА-ЯЁ0-9]*\d)[A-ZА-ЯЁ0-9\-]{6,7}(?!\w)",
                        flags=re.IGNORECASE | re.UNICODE)
        for m in p4.finditer(scan):
            tkn = m.group().strip()
            if ShrDepArrParser._looks_like_reg(tkn) and notBlocked(tkn):
                ShrDepArrParser._add_reg_unique(r, tkn)

    @staticmethod
    def _looks_like_reg(t):
        if not t:
            return False
        s = t.upper()

        # Отсев координат и мусора
        if re.fullmatch(r"\d{5,}[A-ZА-ЯЁ]", s): return False
        if re.fullmatch(r"\d{6,}", s): return False
        if re.fullmatch(r"[A-ZА-ЯЁ]{5,}", s): return False
        if re.fullmatch(r"\d{2,6}[NS]\d{2,6}[EW]", s): return False
        if re.fullmatch(r"[NS]\d+|[EW]\d+", s): return False
        if re.fullmatch(r"СЕРГЕЕВ|БОГДАНО|ОБЕСПЕЧ.*", s): return False

        # Известные хорошие шаблоны
        if re.fullmatch(r"RA-?\d{3,4}[A-Z]?", s): return True
        if re.fullmatch(r"[A-ZА-ЯЁ]{1,3}-?\d{3,4}[A-ZА-ЯЁ]?", s): return True
        if re.fullmatch(r"[A-ZА-ЯЁ]\d{4,}[A-ZА-ЯЁ]?", s): return True
        if re.fullmatch(r"\d{3,}[A-ZА-ЯЁ]{1,2}", s): return True


        if 6 <= len(s) <= 8 and re.fullmatch(r"[A-ZА-ЯЁ0-9\-]+", s) and re.search(r"[A-ZА-ЯЁ]", s) and re.search(r"\d", s):
            return True

        return False

    @staticmethod
    def _add_reg_unique(r, val):
        if not val or not str(val).strip():
            return
        if val not in r["regNumbers"]:
            r["regNumbers"].append(val)

    @staticmethod
    def _extract_aircraft_model(rawAll, r):
        if not rawAll:
            return
        s = str(rawAll)
        s = s.replace('\u00A0', ' ').replace('\u2007', ' ').replace('\u202F', ' ')
        s = re.sub(r"[ \t\x0B\f\r\n]+", " ", s).strip()
        s = ShrDepArrParser._normalize_text(s)

        patterns = [
            r"\bDJI\s+MAVIC\s*AIR\s*2S\b",
            r"\bDJI\s+MAVIC\s*3\s*PRO\b",
            r"\bDJI\s+MAVIC\s*3\s*CLASSIC\b",
            r"\bDJI\s+MAVIC\s*3\b",
            r"\bDJI\s+MAVIC\s*2\b",
            r"\bDJI\s+MAVIC\s*AIR\b",
            r"\bDJI\s+PHANTOM\s*4\w*\b",
            r"\bDJI\s+MINI\s*2\b",
            r"\bDJI\s+MINI\s*3\s*PRO\b",
            r"\bDJI\s+MINI\s*3\b",
            r"\bDJI\s+MINI\s*4\s*PRO\b",
            r"\bDJI\s+AIR\s*2S\b",
            r"\bDJI\s+AVATA\w*\b",
            r"\bDJI\s+FPV\w*\b",
            r"\bDJI\s+MATRICE\s*30T\b",
            r"\bDJI\s+MATRICE\s*300\b",
            r"\bDJI\s+MATRICE\s*350\b",
            r"\bDJI\s+MATRICE\s*200\b",
            r"\bDJI\s+MATRICE\s*210\b",
            r"\bDJI\s+MATRICE\s*600\b",
            r"\bDJI\s+INSPIRE\s*1\b",
            r"\bDJI\s+INSPIRE\s*2\b",
            r"\bDJI\s+AGRAS\s*T10\b",
            r"\bDJI\s+AGRAS\s*T30\b",
            r"\bDJI\s+AGRAS\s*T40\b",
            r"\bAUTEL\s+EVO\s*II\b",
            r"\bGEPRC\s+CINEBOT30\b",
            r"\bGEPRC\s+CINEBOT35\b",
            r"\bPARROT\s+ANAFI\w*\b",
            r"\bSJRC\s+F22\b",
            r"\bSJRC\s+S20\b",
            r"\bSJRC\s+S2\s*PRO\+\b",
            r"\bS2\s*PRO\+\b",
            r"\bGEOSCAN\s*101\b",
            r"\bGEOSCAN\s*119\b",
            r"\bGEOSCAN\s*201\b",
            r"\bGEOSCAN\s*GEMINI\b",
            r"\bGEOSCAN\s*2201\b",
            r"\bГЕОСКАН\s*101\b",
            r"\bГЕОСКАН\s*119\b",
            r"\bГЕОСКАН\s*201\b",
            r"\bГЕОСКАН\s*GEMINI\b",
            r"\bГЕОСКАН\s*2201\b",
        ]
        for pat in patterns:
            p = re.compile(pat, flags=re.IGNORECASE)
            m = p.search(s)
            if m:
                mdl = re.sub(r"\s+", " ", m.group()).strip()
                if not r.get("aircraftModel"):
                    r["aircraftModel"] = mdl
                break

    @staticmethod
    def _merge_semi(current, add):
        val = ShrDepArrParser._normalize_text(add) or ""
        if not val.strip():
            return current
        if not current or not str(current).strip():
            return val
        # не дублируем (по частям через ;)
        parts = re.split(r"\s*;\s*", str(current))
        for part in parts:
            if part.strip().lower() == val.strip().lower():
                return current
        return str(current) + "; " + val





def find_first_excel_file():
    for ext in ("*.xlsx", "*.xls", "*.xlsm"):
        files = glob.glob(ext)
        if files:
            return files[0]
    return None

def parse_excel_file(path, limit=None):
    df = pd.read_excel(path, sheet_name=0, dtype=str)
    df = df.iloc[:, :4]
    df.columns = ["center", "shr", "dep", "arr"]
    if limit:
        df = df.head(limit)

    n_chunks = min(cpu_count(), len(df))  # чтобы не делать больше процессов, чем строк
    chunk_size = max(1, len(df) // n_chunks)
    chunks = [df.iloc[i*chunk_size:(i+1)*chunk_size] for i in range(n_chunks)]

    with Pool(n_chunks) as pool:
        results = pool.map(parse_chunk, chunks)  # <-- напрямую функция

    records = [item for sublist in results for item in sublist]
    return records



def main():
    start_time = time.time()
    print("Начало обработки данных")


    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    else:
        excel_path = find_first_excel_file()
        if not excel_path:
            print("Не найден Excel-файл в текущей папке. Передайте путь как аргумент.")
            return

    print(f"Читаем Excel: {excel_path}")
    records = parse_excel_file(excel_path, limit=80000)
    print(f"Найдено записей (ограничение): {len(records)})")


    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    middle_time = time.time()
    print(f"Данные распарсены, производим вставку, время: {middle_time - start_time:.2f} секунд")

    try:
        flight_rows = []
        tmp_rows = []

        for rec in records:
            rec["aircraftModel"] = normalize_model(rec.get("aircraftModel"))
            dep_time = parse_datetime(rec["date"], rec.get("departureTime"))
            arr_time = parse_datetime(rec["date"], rec.get("arrivalTime"))

            dep_point = parse_coords(rec.get("departureCoords"))
            arr_point = parse_coords(rec.get("arrivalCoords"))

            distance_km = None
            if dep_point and arr_point:
                distance_km = haversine(dep_point[0], dep_point[1], arr_point[0], arr_point[1])

            flight_rows.append((
                rec.get("sid"),
                dep_time,
                arr_time,
                rec.get("operator"),
                rec.get("aircraftType"),
                rec.get("aircraftModel"),
                rec.get("status"),
                f"SRID=4326;POINT({dep_point[0]} {dep_point[1]})" if dep_point else None,
                f"SRID=4326;POINT({arr_point[0]} {arr_point[1]})" if arr_point else None,
                rec.get("remarks"),
                rec.get("sourceCenter"),
                rec.get("phones", []),
                rec.get("remarksRaw"),
                rec.get("rawMessage"),
                rec.get("regNumbers", []),
                distance_km
            ))

            tmp_rows.append((
                rec.get("sid"),
                f"SRID=4326;POINT({dep_point[0]} {dep_point[1]})" if dep_point else None,
                f"SRID=4326;POINT({arr_point[0]} {arr_point[1]})" if arr_point else None
            ))

        # Вставка в flights
        insert_query = """
            INSERT INTO flights (
                sid, dep_time, arr_time, operator, aircraft_type, aircraft_model,
                status, dep_point, arr_point,
                remarks, source_center, phones,
                remarks_raw, raw_message, reg_numbers, distance_km
            )
            VALUES %s
            ON CONFLICT (sid) DO NOTHING
        """
        execute_values(cur, insert_query, flight_rows, page_size=1000)

        middle_time1 = time.time()
        print(f"Данные о полетах вставлены, определяем регионы, время: {middle_time1 - start_time:.2f} секунд")


        cur.execute("""
            CREATE TEMP TABLE flights_tmp (
                sid TEXT,
                dep_geom geometry(Point, 4326),
                arr_geom geometry(Point, 4326)
            ) ON COMMIT DROP
        """)
        execute_values(cur, "INSERT INTO flights_tmp (sid, dep_geom, arr_geom) VALUES %s", tmp_rows, page_size=1000)


        cur.execute("""
            INSERT INTO flights_regions (fk_flight_id, fk_region_id, role)
            SELECT f.sid, r1.gid, 'both'
            FROM flights_tmp f
            JOIN regions r1 ON ST_Within(f.dep_geom, r1.geom)
            JOIN regions r2 ON ST_Within(f.arr_geom, r2.geom)
            WHERE r1.gid = r2.gid
            ON CONFLICT DO NOTHING
        """)
        cur.execute("""
            INSERT INTO flights_regions (fk_flight_id, fk_region_id, role)
            SELECT f.sid, r1.gid, 'departure'
            FROM flights_tmp f
            JOIN regions r1 ON ST_Within(f.dep_geom, r1.geom)
            LEFT JOIN regions r2 ON ST_Within(f.arr_geom, r2.geom)
            WHERE r2.gid IS NULL OR r1.gid <> r2.gid
            ON CONFLICT DO NOTHING
        """)
        cur.execute("""
            INSERT INTO flights_regions (fk_flight_id, fk_region_id, role)
            SELECT f.sid, r2.gid, 'arrival'
            FROM flights_tmp f
            JOIN regions r2 ON ST_Within(f.arr_geom, r2.geom)
            LEFT JOIN regions r1 ON ST_Within(f.dep_geom, r1.geom)
            WHERE r1.gid IS NULL OR r1.gid <> r2.gid
            ON CONFLICT DO NOTHING
        """)

        conn.commit()

    finally:
        cur.close()
        conn.close()

    end_time = time.time()
    print(f"Общее время выполнения: {end_time - start_time:.2f} секунд")

def main_from_file(excel_path):

    records = parse_excel_file(excel_path)
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    try:
        flight_rows = []
        tmp_rows = []

        for rec in records:
            rec["aircraftModel"] = normalize_model(rec.get("aircraftModel"))
            dep_time = parse_datetime(rec["date"], rec.get("departureTime"))
            arr_time = parse_datetime(rec["date"], rec.get("arrivalTime"))

            dep_point = parse_coords(rec.get("departureCoords"))
            arr_point = parse_coords(rec.get("arrivalCoords"))

            distance_km = None
            if dep_point and arr_point:
                distance_km = haversine(dep_point[0], dep_point[1], arr_point[0], arr_point[1])

            flight_rows.append((
                rec.get("sid"),
                dep_time,
                arr_time,
                rec.get("operator"),
                rec.get("aircraftType"),
                rec.get("aircraftModel"),
                rec.get("status"),
                f"SRID=4326;POINT({dep_point[0]} {dep_point[1]})" if dep_point else None,
                f"SRID=4326;POINT({arr_point[0]} {arr_point[1]})" if arr_point else None,
                rec.get("remarks"),
                rec.get("sourceCenter"),
                rec.get("phones", []),
                rec.get("remarksRaw"),
                rec.get("rawMessage"),
                rec.get("regNumbers", []),
                distance_km
            ))

            tmp_rows.append((
                rec.get("sid"),
                f"SRID=4326;POINT({dep_point[0]} {dep_point[1]})" if dep_point else None,
                f"SRID=4326;POINT({arr_point[0]} {arr_point[1]})" if arr_point else None
            ))

        # Вставка в flights
        from psycopg2.extras import execute_values
        insert_query = """
            INSERT INTO flights (
                sid, dep_time, arr_time, operator, aircraft_type, aircraft_model,
                status, dep_point, arr_point,
                remarks, source_center, phones,
                remarks_raw, raw_message, reg_numbers, distance_km
            )
            VALUES %s
            ON CONFLICT (sid) DO NOTHING
        """
        execute_values(cur, insert_query, flight_rows, page_size=1000)

        # Временная таблица
        cur.execute("""
            CREATE TEMP TABLE flights_tmp (
                sid TEXT,
                dep_geom geometry(Point, 4326),
                arr_geom geometry(Point, 4326)
            ) ON COMMIT DROP
        """)
        execute_values(cur, "INSERT INTO flights_tmp (sid, dep_geom, arr_geom) VALUES %s", tmp_rows, page_size=1000)

        # Вставка в flights_regions
        cur.execute("""
            INSERT INTO flights_regions (fk_flight_id, fk_region_id, role)
            SELECT f.sid, r1.gid, 'both'
            FROM flights_tmp f
            JOIN regions r1 ON ST_Within(f.dep_geom, r1.geom)
            JOIN regions r2 ON ST_Within(f.arr_geom, r2.geom)
            WHERE r1.gid = r2.gid
            ON CONFLICT DO NOTHING
        """)
        cur.execute("""
            INSERT INTO flights_regions (fk_flight_id, fk_region_id, role)
            SELECT f.sid, r1.gid, 'departure'
            FROM flights_tmp f
            JOIN regions r1 ON ST_Within(f.dep_geom, r1.geom)
            LEFT JOIN regions r2 ON ST_Within(f.arr_geom, r2.geom)
            WHERE r2.gid IS NULL OR r1.gid <> r2.gid
            ON CONFLICT DO NOTHING
        """)
        cur.execute("""
            INSERT INTO flights_regions (fk_flight_id, fk_region_id, role)
            SELECT f.sid, r2.gid, 'arrival'
            FROM flights_tmp f
            JOIN regions r2 ON ST_Within(f.arr_geom, r2.geom)
            LEFT JOIN regions r1 ON ST_Within(f.dep_geom, r1.geom)
            WHERE r1.gid IS NULL OR r1.gid <> r2.gid
            ON CONFLICT DO NOTHING
        """)
        conn.commit()
    finally:
        cur.close()
        conn.close()



if __name__ == "__main__":
    main()