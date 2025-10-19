# -*- coding: utf-8 -*-
import os

from flask import Flask, jsonify, render_template
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, render_template, redirect, url_for, session
import psycopg2
from werkzeug.utils import secure_filename

from auth import auth_bp
import pandas as pd
from flask import request
from datetime import datetime
from config import *
import full_parser

app = Flask(__name__)
app.config.from_pyfile('config.py')
app = Flask(__name__)

app.secret_key = key

app.register_blueprint(auth_bp)


@app.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("auth.login"))
    return render_template("index.html", username=session["username"])


region_map = {
    "Московская область": "RUMOW",
    "Москва": "RUMOS",
    "Санкт-Петербург": "RUSPE",
    "Ленинградская область": "RULEN",
    "Республика Коми": "RUKO",
    "Республика Татарстан": "RUTA",
    "Республика Башкортостан": "RUBA",
    "Республика Саха (Якутия)": "RUSA",
    "Краснодарский край": "RUKDA",
    "Красноярский край": "RUKYA",
    "Ставропольский край": "RUSTA",
    "Приморский край": "RUPRI",
    "Хабаровский край": "RUKHA",
    "Амурская область": "RUAMU",
    "Архангельская область": "RUARK",
    "Астраханская область": "RUAST",
    "Белгородская область": "RUBEL",
    "Брянская область": "RUBRY",
    "Владимирская область": "RUVLA",
    "Волгоградская область": "RUVGG",
    "Вологодская область": "RUVLG",
    "Воронежская область": "RUVOR",
    "Ивановская область": "RUIVA",
    "Иркутская область": "RUIRK",
    "Калининградская область": "RUKGD",
    "Калужская область": "RUKLU",
    "Камчатский край": "RUKAM",
    "Кемеровская область": "RUKEM",
    "Кировская область": "RUKIR",
    "Костромская область": "RUKOS",
    "Курганская область": "RUKGN",
    "Курская область": "RUKRS",
    "Липецкая область": "RULIP",
    "Магаданская область": "RUMAG",
    "Мурманская область": "RUMUR",
    "Нижегородская область": "RUNIZ",
    "Новгородская область": "RUNGR",
    "Новосибирская область": "RUNVS",
    "Омская область": "RUOMS",
    "Оренбургская область": "RUORE",
    "Орловская область": "RUORL",
    "Пензенская область": "RUPNZ",
    "Пермский край": "RUPER",
    "Псковская область": "RUPSK",
    "Ростовская область": "RUROS",
    "Рязанская область": "RURYA",
    "Самарская область": "RUSAM",
    "Саратовская область": "RUSAR",
    "Сахалинская область": "RUSAK",
    "Свердловская область": "RUSVE",
    "Смоленская область": "RUSMO",
    "Тамбовская область": "RUTAM",
    "Тверская область": "RUTVE",
    "Томская область": "RUTOM",
    "Тульская область": "RUTUL",
    "Тюменская область": "RUTYU",
    "Ульяновская область": "RUULY",
    "Челябинская область": "RUCHE",
    "Забайкальский край": "RUZAB",
    "Ярославская область": "RUYAR",
    "Республика Алтай": "RUAL",
    "Республика Бурятия": "RUBU",
    "Республика Дагестан": "RUDA",
    "Республика Ингушетия": "RUIN",
    "Республика Калмыкия": "RUKL",
    "Карачаево-Черкесская Республика": "RUKC",
    "Республика Карелия": "RUKR",
    "Кабардино-Балкарская Республика": "RUKB",
    "Республика Мордовия": "RUMO",
    "Республика Северная Осетия — Алания": "RUSE",
    "Республика Тыва": "RUTY",
    "Республика Хакасия": "RUKK",
    "Республика Крым": "RUCR",
    "Республика Адыгея": "RUAD",
    "Чеченская Республика": "RUCE",
    "Чувашская Республика": "RUCU",
    "Удмуртская Республика": "RUUD",
    "Республика Марий Эл": "RUME",
    "Еврейская автономная область": "RUYEV",
    "Ненецкий автономный округ": "RUNEN",
    "Ханты-Мансийский автономный округ — Югра": "RUKHM",
    "Ямало-Ненецкий автономный округ": "RUYAN",
    "Чукотский автономный округ": "RUCHU",
    "Запорожская область": "RUZP",
    "Алтайский край": "RUALT",
    "Донецкая Народная Республика": "RUDON",
    "Луганская Народная Республика": "RULUG",
    "Херсонская область": "RUHR",
    "Севастополь": "RUSV"
}


def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn


@app.route("/flights/counts")
def flights_counts():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT r.name, COUNT(*) as cnt
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        JOIN regions r ON fr.fk_region_id = r.gid
        GROUP BY r.name
    """)

    rows = cur.fetchall()
    counts_dict = {row[0]: row[1] for row in rows}
    cur.close()
    conn.close()

    result = {}
    for region_full_name, region_code in region_map.items():
        count = 0
        for db_region_name, db_count in counts_dict.items():
            if (region_full_name == db_region_name or
                    region_full_name in db_region_name or
                    db_region_name in region_full_name):
                count += db_count
        result[region_code] = count

    return jsonify(result)


@app.route("/flights/stats")
def flights_stats():
    conn = get_db_connection()

    try:
        cur1 = conn.cursor()
        cur1.execute("SELECT COUNT(*) FROM flights")
        total_flights = cur1.fetchone()[0]
        cur1.close()

        cur2 = conn.cursor()
        cur2.execute("""
            SELECT 
                COUNT(*) as valid_flights,
                COALESCE(SUM(EXTRACT(EPOCH FROM (arr_time - dep_time))/3600), 0) as total_hours,
                COALESCE(AVG(EXTRACT(EPOCH FROM (arr_time - dep_time))/3600), 0) as avg_minutes,
                COUNT(DISTINCT DATE(dep_time)) as unique_days
            FROM flights 
            WHERE dep_time IS NOT NULL 
              AND arr_time IS NOT NULL 
              AND dep_time < arr_time
        """)

        row = cur2.fetchone()
        cur2.close()

        valid_flights = row[0] if row[0] else 0
        total_hours = round(row[1], 1) if row[1] else 0
        avg_minutes = round(row[2], 1) if row[2] else 0
        unique_days = row[3] if row[3] else 1
        avg_flights_per_day = round(total_flights / unique_days, 1) if unique_days > 0 else 0

    except Exception as e:
        print(f"Ошибка при получении статистики: {e}")
        conn.rollback()

        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM flights")
        total_flights = cur.fetchone()[0]
        cur.close()

        total_hours = 0
        avg_minutes = 0
        avg_flights_per_day = 0

    conn.close()

    return jsonify({
        "total_flights": total_flights,
        "total_hours": total_hours,
        "avg_minutes": avg_minutes,
        "avg_flights_per_day": avg_flights_per_day
    })


@app.route("/flights/regions_stats")
def flights_regions_stats():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            source_center,
            TO_CHAR(dep_time, 'MM') as month,
            COUNT(*) as flights,
            COALESCE(SUM(EXTRACT(EPOCH FROM (arr_time - dep_time))/3600), 0) as hours
        FROM flights
        WHERE dep_time IS NOT NULL AND arr_time IS NOT NULL AND dep_time < arr_time
        GROUP BY source_center, month
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    data = {}
    for region, month, flights, hours in rows:
        if region not in data:
            data[region] = {"flights_per_month": {}, "hours_per_month": {}, "total_flights": 0}
        data[region]["flights_per_month"][month] = flights
        data[region]["hours_per_month"][month] = round(hours, 1)
        data[region]["total_flights"] += flights

    result = sorted(
        [{"region": r, **vals} for r, vals in data.items()],
        key=lambda x: x["total_flights"],
        reverse=True
    )

    return jsonify(result)

@app.route("/region/<region_name>/top-operators")
def region_top_operators_by_name(region_name):
    """
    Топ операторов для региона с учетом классификации на физических и юридических лиц
    """
    conn = get_db_connection()
    cur = conn.cursor()

    reverse_region_map = {v: k for k, v in region_map.items()}
    full_region_name = reverse_region_map.get(region_name, region_name)

    try:
        cur.execute("""
            SELECT gid
            FROM regions r
            WHERE r.name ILIKE %s OR r.name ILIKE %s
            LIMIT 1
        """, (f"%{full_region_name}%", f"%{region_name}%"))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify([])

        region_gid = row[0]

        cur.execute("""
        WITH categorized_operators AS (
        SELECT 
            COALESCE(NULLIF(f.operator, ''), 'Физические лица') AS operator,
            CASE 
                WHEN f.operator IN (
                    'ГУКАСЯН АРТАШЕС ОГАНЕСОВИЧ',
                    'АРХИПОВ ВЛАДИСЛАВ МИХАЙЛОВИЧ',
                    'ГУСЕВ СЕРГЕЙ ВЛАДИМИРОВИЧ',
                    'МИТРОФАНОВ ДМИТРИЙ АЛЕКСЕЕВИЧ',
                    'ГУБИН МАКСИМ ЮРЬЕВИЧ',
                    'ПЕГУСОВ ДМИТРИЙ ЮРЬЕВИЧ',
                    'ОСИПОВ АЛЕКСАНДР ГЕННАДЬЕВИЧ',
                    'ФИЛИППОВ ПАВЕЛ АНАТОЛЬЕВИЧ',
                    'ПАНОВ ДМИТРИЙ ВЛАДИМИРОВИЧ',
                    'ГУРЬЯНОВ ВЛАДИСЛАВ АЛЕКСАНДРОВИЧ',
                    'ГАУСС ПРОКОФЬЕВ ИВАН',
                    'ДЕРГУНОВ АЛЕКСАНДР ВЛАДИМИРОВИЧ',
                    'БЕЛЬКЕВИЧ ПАВЕЛ АЛЕКСАНДРОВИЧ',
                    'СТЕПАНОВ СЕРГЕЙ ВАЛЕРЬЕВИЧ',
                    'БАЛОБАНОВ ВИТАЛИЙ АЛЕКСАНДРОВИЧ',
                    'СЕЛИВАНОВ АРТУР АРТУРОВИЧ',
                    'ГУСЕВ АРТЕМ ОЛЕГОВИЧ',
                    'ИВАНОВА ЕКАТЕРИНА ФЕДОРОВНА',
                    'СТЕПАНОВ АЛЕКСЕЙ АЛЕКСАНДРОВИЧ',
                    'САБАНОВ АЛЕКСЕЙ ИВАНОВИЧ',
                    'МИНОСЯН ЕРВАНД ИШХАНОВИЧ',
                    'БАРАНОВ ВЯЧЕСЛАВ АЛЕКСЕЕВИЧ',
                    'РАСТОРГУЕВ ИВАН АЛЕКСАНДРОВИЧ',
                    'ВЕРТИПРАХОВ АНДРЕЙ БРОНИСЛАВОВИЧ',
                    'ИВАНОВА АННА СЕРГЕЕВНА',
                    'ИВАНОВ РОМАН ЮРЬЕВИЧ',
                    'СТЕПАНОВ ЭДУАРД ВИТАЛЬЕВИЧ',
                    'БАКАНОВ МИХАИЛ ЮРЬЕВИЧ',
                    'СТЕПАНОВ СТАНИСЛАВ АЛЕКСАНДРОВИЧ',
                    'ГУТОВ СЕРГЕЙ АЛЕКСАНДРОВИЧ',
                    'БЕЛОВ ЕГОР РОМАНОВИЧ',
                    'ШЕРГУНОВ ВЛАДИСЛАВ АНДРЕЕВИЧ',
                    'МАЛОВ ГЕННАДИЙ ИВАНОВИЧ',
                    'ИВАНОВ ПАВЕЛ ВЛАДИМИРОВИЧ',
                    'ЭЙВАЗОВ ШАМХАЛ ЯГУБОВИЧ',
                    'ИГОЛКИН АЛЕКСАНДР РОМАНОВИЧ',
                    'КОЛЕГОВ МАКСИМ ИВАНОВИЧ',
                    'ВЕНГУРА НИКОЛАЙ НИКОЛАЕВИЧ',
                    'ГУБИН АНДРЕЙ СЕРГЕЕВИЧ',
                    'РОМАНОВ РОМАН ЮРЬЕВИЧ',
                    'ДАДАЕВ РАМАЗАН РЕЗВАНОВИЧ',
                    'ИСТОМИН ИВАН СЕРГЕЕВИЧ',
                    'СТЕПАНОВ АЛЕКСЕЙ ВЛАДИМИРОВИЧ',
                    'КРАСНОГОРОВ АНДРЕЙ АЛЕКСАНДРОВИЧ',
                    'ЕФРЕМОВ ДЕНИС АЛЕКСАНДРОВИЧ',
                    'ЛАГУТОВ ВИКТОР СЕРГЕЕВИЧ',
                    'ГРИШАНОВ ЮРИЙ КОНСТАНТИНОВИЧ',
                    'ВЕЧКАНОВ ДМИТРИЙ ЮРЬЕВИЧ',
                    'ПОПЫВАНОВ СЕРГЕЙ ИВАНОВИЧ',
                    'БРЕЗГУЛЕВСКИЙ ЕВГЕНИЙ ДМИТРИЕВИЧ',
                    'ЗАПБАРОВ АРТУР РУСЛАНОВИЧ',
                    'ФИЛИПОВ АНДРЕЙ АЛЕКСАНДРОВИЧ',
                    'КОБОЗЕВ АРТЕМ ВЛАДИСЛАВОВИЧ',
                    'КОМАРОВ ВАЛЕРИЙ АЛЕКСАНДРОВИЧ',
                    'ГУМЕЛЬ АНДРЕЙ АНАТОЛЬЕВИЧ',
                    'КОСТЮШИН АЛЕКСЕЙ АЛЕКСАНДРОВИЧ',
                    'КОНОНОВ АЛЕКСЕЙ СЕРГЕЕВИЧ',
                    'АНОХИН АЛЕКСАНДР АНДРЕЕВИЧ',
                    'КОСТРОВ АНДРЕЙ ВЛАДИМИРОВИЧ',
                    'КРУЧИНИН ДЕНИС ИВАНОВИЧ',
                    'КОЛЕСНИКОВ ОЛЕГ ВЛАДИМИРОВИЧ',
                    'КОЛТЫШЕВ АЛЕКСЕЙ АНАТОЛЬЕВИЧ',
                    'КОРОЛЕВ АЛЕКСЕЙ СЕРГЕЕВИЧ',
                    'СИПКОВ АЛЕКСАНДР СЕРГЕЕВИЧ',
                    'ИППОЛИТОВ ДЕНИС СЕРГЕЕВИЧ',
                    'КОРОЛЕВ СЕРГЕЙ АЛЕКСАНДРОВИЧ',
                    'КОСТЮШИН АЛЕКСЕЙ АНДРЕЕВИЧ',
                    'КОЛПАКОВ АРТЕМ ДМИТРИЕВИЧ',
                    'КУДРЯШОВ ДМИТРИЙ ВИКТОРОВИЧ',
                    'КОШЕВОЙ СЕРГЕЙ ВИКТОРОВИЧ',
                    'КОЛОТЫГИН АЛЕКСЕЙ',
                    'КОНЫГИН ДЕНИС АЛЕКСАНДРОВИЧ',
                    'КОСТРИК ЕВГЕНИЙ МИХАЙЛОВИЧ',
                    'КОРМАЧЕВ АЛЕКСАНДР СЕРГЕЕВИЧ',
                    'КОВАЛЕНКО ПАВЕЛ ФЕДОРОВИЧ',
                    'КОЗЫРЕВ КОНСТАНТИН ВИКТОРОВИЧ',
                    'КОРЧАГИН РОМАН АНДРЕЕВИЧ',
                    'АЗАРОВ ДМИТРИЙ НИКОЛАЕВИЧ',
                    'КОЗЛОВ НИКОЛАЙ ПЕТРОВИЧ',
                    'ИСМАГУЛОВ ЗАМАНБЕК',
                    'КОПЫРИН ВИТАЛИЙ ВАСИЛЬЕВИЧ',
                    'КОМИССАРОВ ЯРОСЛАВ ДМИТРИЕВИЧ',
                    'ГУБАРЕВ ЯРОСЛАВ ДМИТРИЕВИЧ',
                    'ОПЕРАТОР КОЧЕТОВ А.О.'
                ) THEN 'Физическое лицо'
                WHEN f.operator ~ '^ИП' THEN 'Юридическое лицо'
                WHEN f.operator ~ '^(ООО|АО|ГУ|ПАО|ФГБУ|ФГКУ|ГБУ|АНО|ФКП|УМВД|ГКУ|МЧС|МВД|ФГП|ОГАУ|ФАУ|ФГАНУ|ГАУ|МКУ|МАУ|БУВО|КГКУ|ОГУП|ОАО|ФИЛИАЛ|УПРАВЛЕНИЕ|МИНИСТЕРСТВО|ДЕПАРТАМЕНТ|РОСГВАРДИЯ|РОСКАДАСТР|РОСРЕЕСТР|АДМИНИСТРАЦИЯ|ЛИЗААЛЕРТ|ГЛАВНОЕ|ОТДЕЛ|СИБИРСКИЙ|СПСЧ|ФБУ|СФ|ГКУ|ГАНОУ|ФГАОУ|СИП|ПОВОЛЖСКИЙ|ППК|СЕВЕРНОЕ|КГБУ|МУНИЦИПАЛЬНОЕ|ФЕДЕРАЦИЯ|СЕВЕРО|УРАЛЬСКОЕ|БЕСПИЛОТНАЯ|ПУБЛИЧНО|ГРУППА|РОССИЙСКАЯ|ПРИАМУРСКОЕ|ПРЕСС|НИЖЕГОРОДСКАЯ|ВОЛГОГРАДСКАЯ|КО|ОМОН)' 
                    OR f.operator ~ '(ЦЕНТР|СЛУЖБА|ОТРЯД|АКАДЕМИЯ|КОЛЛЕДЖ|УНИВЕРСИТЕТ|ИНСТИТУТ|ЛАБОРАТОРИЯ|ФОНД|НАУЧНЫЙ|ЗАВОД|КОМПАНИЯ|АГЕНТСТВО|ИНСПЕКЦИЯ)'
                THEN 'Юридическое лицо'
                ELSE 'Физическое лицо'
            END AS entity_type
        FROM flights f
        INNER JOIN flights_regions fr ON fr.fk_flight_id = f.sid
        WHERE fr.fk_region_id = %s
    )
    SELECT 
        CASE 
            WHEN entity_type = 'Юридическое лицо' THEN operator
            ELSE 'Физические лица'
        END AS operator_name,
        COUNT(*) AS flights_count
    FROM categorized_operators
    GROUP BY operator_name
    ORDER BY flights_count DESC
    LIMIT 5;
        """, (region_gid,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = [{"operator": row[0], "flights_count": row[1]} for row in rows]
        return jsonify(result)

    except Exception as e:
        print(f"Ошибка при получении топ операторов для региона (name) {region_name}: {e}")
        cur.close()
        conn.close()
        return jsonify({"error": "Ошибка получения данных"}), 500
        
@app.route("/flights/admin_regions_flights")
def flights_admin_regions_flights():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            r.name AS region_name,
            COUNT(*) AS flights
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        JOIN regions r ON fr.fk_region_id = r.gid
        GROUP BY r.name
        ORDER BY flights DESC;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "region": row[0],
            "total_flights": row[1]
        })

    return jsonify(result)


@app.route("/flights/admin_regions_hours")
def flights_admin_regions_hours():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            r.name AS region_name,
            COALESCE(
                SUM(
                    CASE 
                        WHEN f.arr_time > f.dep_time 
                             AND f.arr_time IS NOT NULL 
                             AND f.dep_time IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (f.arr_time - f.dep_time)) / 3600
                        ELSE 0
                    END
                ), 
            0) AS hours
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        JOIN regions r ON fr.fk_region_id = r.gid
        GROUP BY r.name
        ORDER BY hours DESC;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "region": row[0],
            "total_hours": round(row[1], 1)
        })

    return jsonify(result)


@app.route("/region/<region_name>")
def get_region_info(region_name):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    reverse_region_map = {v: k for k, v in region_map.items()}
    full_region_name = reverse_region_map.get(region_name, region_name)

    cur.execute("""
        SELECT f.*, r.name as region_name
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        JOIN regions r ON fr.fk_region_id = r.gid
        WHERE r.name ILIKE %s OR r.name ILIKE %s
        ORDER BY f.dep_time DESC
    """, (f"%{full_region_name}%", f"%{region_name}%"))
    rows = cur.fetchall()

    cur.execute("""
        SELECT COUNT(*) as total_count
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        JOIN regions r ON fr.fk_region_id = r.gid
        WHERE r.name ILIKE %s OR r.name ILIKE %s
    """, (f"%{full_region_name}%", f"%{region_name}%"))
    total_count = cur.fetchone()["total_count"]

    cur.close()
    conn.close()

    return jsonify({
        "total_count": total_count,
        "drones": rows
    })


@app.route("/region/<region_name>/monthly_stats")
def region_monthly_stats(region_name):
    conn = get_db_connection()
    cur = conn.cursor()

    reverse_region_map = {v: k for k, v in region_map.items()}
    full_region_name = reverse_region_map.get(region_name, region_name)

    try:
        cur.execute("""
            SELECT 
                TO_CHAR(f.dep_time, 'MM') as month,
                TO_CHAR(f.dep_time, 'Month') as month_name,
                COUNT(*) as all_flights,
                COUNT(CASE 
                    WHEN f.dep_time IS NOT NULL 
                         AND f.arr_time IS NOT NULL 
                         AND f.dep_time < f.arr_time 
                    THEN 1 
                END) as valid_time_flights,
                COALESCE(
                    SUM(CASE 
                        WHEN f.dep_time IS NOT NULL 
                             AND f.arr_time IS NOT NULL 
                             AND f.dep_time < f.arr_time 
                        THEN EXTRACT(EPOCH FROM (f.arr_time - f.dep_time))/3600 
                    END), 
                0) as hours
            FROM flights f
            JOIN flights_regions fr ON f.sid = fr.fk_flight_id
            JOIN regions r ON fr.fk_region_id = r.gid
            WHERE (r.name ILIKE %s OR r.name ILIKE %s)
              AND f.dep_time IS NOT NULL
            GROUP BY TO_CHAR(f.dep_time, 'MM'), TO_CHAR(f.dep_time, 'Month')
            ORDER BY TO_CHAR(f.dep_time, 'MM')
        """, (f"%{full_region_name}%", f"%{region_name}%"))

        rows = cur.fetchall()

        cur.execute("""
            SELECT COUNT(*) as flights_without_dep_time
            FROM flights f
            JOIN flights_regions fr ON f.sid = fr.fk_flight_id
            JOIN regions r ON fr.fk_region_id = r.gid
            WHERE (r.name ILIKE %s OR r.name ILIKE %s)
              AND f.dep_time IS NULL
        """, (f"%{full_region_name}%", f"%{region_name}%"))

        flights_without_time = cur.fetchone()[0] or 0

        cur.close()
        conn.close()

        months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        month_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

        flights_by_month = [0] * 12
        hours_by_month = [0] * 12

        total_flights_with_time = 0
        total_valid_hours = 0
        for month, month_name, all_flights, valid_time_flights, hours in rows:
            month_index = int(month) - 1
            flights_by_month[month_index] = all_flights
            hours_by_month[month_index] = round(hours, 1)
            total_flights_with_time += all_flights
            total_valid_hours += hours

        total_all_flights = total_flights_with_time + flights_without_time

        result = {
            "months": month_names,
            "flights": flights_by_month,
            "hours": hours_by_month,
            "total_flights": total_all_flights,
            "total_hours": round(total_valid_hours, 1),
            "flights_without_time": flights_without_time,
            "coverage_info": {
                "flights_with_time": total_flights_with_time,
                "flights_with_valid_duration": sum([1 for hours in hours_by_month if hours > 0]),
                "coverage_percent": round((total_flights_with_time / total_all_flights) * 100,
                                          1) if total_all_flights > 0 else 0
            }
        }

        return jsonify(result)

    except Exception as e:
        print(f"Ошибка при получении месячной статистики для региона {region_name}: {e}")
        cur.close()
        conn.close()
        return jsonify({"error": "Ошибка получения данных"}), 500

@app.route("/region/<region_name>/summary_stats")
def region_summary_stats(region_name):
    """Получение общей статистики по региону"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    reverse_region_map = {v: k for k, v in region_map.items()}
    full_region_name = reverse_region_map.get(region_name, region_name)

    try:
        cur.execute("""
        SELECT 
            COUNT(*) as total_flights,
            COALESCE(
                SUM(
                    CASE 
                        WHEN f.arr_time > f.dep_time 
                             AND f.arr_time IS NOT NULL 
                             AND f.dep_time IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (f.arr_time - f.dep_time)) / 3600
                        ELSE 0
                    END
                ), 
            0) as total_hours,
            f.source_center,
            COUNT(DISTINCT f.operator) as unique_operators,
            COUNT(DISTINCT f.aircraft_model) as unique_models
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        JOIN regions r ON fr.fk_region_id = r.gid
        WHERE (r.name ILIKE %s OR r.name ILIKE %s)
        GROUP BY f.source_center
        ORDER BY total_flights DESC
        LIMIT 1
        """, (f"%{full_region_name}%", f"%{region_name}%"))

        stats = cur.fetchone()
        cur.close()
        conn.close()

        if stats:
            return jsonify({
                "total_flights": stats["total_flights"],
                "total_hours": round(stats["total_hours"], 1),
                "source_center": stats["source_center"] or "Не указан",
                "unique_operators": stats["unique_operators"],
                "unique_models": stats["unique_models"]
            })
        else:
            return jsonify({
                "total_flights": 0,
                "total_hours": 0,
                "source_center": "Не указан",
                "unique_operators": 0,
                "unique_models": 0
            })

    except Exception as e:
        print(f"Ошибка при получении общей статистики для региона {region_name}: {e}")
        cur.close()
        conn.close()
        return jsonify({"error": "Ошибка получения данных"}), 500
    

@app.route("/flights/top-uav-types")
def top_uav_types():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
        SELECT 
            TRIM(aircraft_model) as uav_model,
            COUNT(*) as count
        FROM flights
        WHERE TRIM(aircraft_model) IS NOT NULL
          AND TRIM(aircraft_model) <> ''
        GROUP BY TRIM(aircraft_model)
        ORDER BY count DESC
        LIMIT 10;
        """)

        rows = cur.fetchall()
        result = [{"uav_type": row[0], "count": row[1]} for row in rows]

        cur.close()
        conn.close()

        return jsonify(result)

    except Exception as e:
        print(f"Ошибка при получении топ БВС: {e}")
        cur.close()
        conn.close()
        return jsonify([]), 500


@app.route("/region/<region_name>/top-uav-types")
def region_top_uav_types(region_name):
    conn = get_db_connection()
    cur = conn.cursor()

    reverse_region_map = {v: k for k, v in region_map.items()}
    full_region_name = reverse_region_map.get(region_name, region_name)

    try:
        cur.execute("""
            SELECT 
                COALESCE(NULLIF(TRIM(f.aircraft_model), ''), 'Не указано') AS uav_model,
                COUNT(*) AS count
            FROM flights f
            JOIN flights_regions fr ON f.sid = fr.fk_flight_id
            JOIN regions r ON fr.fk_region_id = r.gid
            WHERE (r.name ILIKE %s OR r.name ILIKE %s)
            GROUP BY COALESCE(NULLIF(TRIM(f.aircraft_model), ''), 'Не указано')
            ORDER BY count DESC
            LIMIT 10;
        """, (f"%{full_region_name}%", f"%{region_name}%"))

        rows = cur.fetchall()
        result = [{"uav_type": row[0], "count": row[1]} for row in rows]

        cur.close()
        conn.close()

        return jsonify(result)

    except Exception as e:
        print(f"Ошибка при получении топ БВС для региона {region_name}: {e}")
        cur.close()
        conn.close()
        return jsonify([]), 500


@app.route("/region/<region_name>/geojson")
def region_geojson_data(region_name):
    """
    Получение GeoJSON данных региона с информацией о полётах.
    Полёты, попавшие в запретные зоны, отмечаются флагом in_restricted.
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    reverse_region_map = {v: k for k, v in region_map.items()}
    full_region_name = reverse_region_map.get(region_name, region_name)

    try:
        # Получаем геометрию региона
        cur.execute("""
        SELECT ST_AsGeoJSON(r.geom) as region_geom, r.gid
        FROM regions r
        WHERE r.name ILIKE %s OR r.name ILIKE %s
        LIMIT 1
        """, (f"%{full_region_name}%", f"%{region_name}%"))

        region_result = cur.fetchone()
        region_geom = None
        region_gid = None
        if region_result and region_result["region_geom"]:
            region_geom = region_result["region_geom"]
            region_gid = region_result["gid"]

        # Получаем SID полётов, которые находятся в запретных зонах
        cur.execute("""
        SELECT DISTINCT f.sid
        FROM flights f
        JOIN flights_regions fr ON fr.fk_flight_id = f.sid
        JOIN restricted_zones rz ON ST_Within(COALESCE(f.dep_point, f.arr_point), rz.geom)
        WHERE fr.fk_region_id = %s
        """, (region_gid,))

        restricted_sids = {row['sid'] for row in cur.fetchall()}

        # Получаем полёты региона с координатами
        cur.execute("""
        SELECT 
            f.sid,
            ST_AsGeoJSON(f.dep_point) as dep_geojson,
            ST_AsGeoJSON(f.arr_point) as arr_geojson,
            fr.role,
            f.operator,
            f.aircraft_model,
            f.dep_time
        FROM flights f
        JOIN flights_regions fr ON f.sid = fr.fk_flight_id
        WHERE fr.fk_region_id = %s
          AND (f.dep_point IS NOT NULL OR f.arr_point IS NOT NULL)
        ORDER BY f.dep_time DESC
        """, (region_gid,))

        flights = cur.fetchall()

        cur.close()
        conn.close()

        # Формируем данные для карты
        flights_data = []
        for flight in flights:
            flights_data.append({
                "sid": flight["sid"],
                "dep": flight["dep_geojson"],
                "arr": flight["arr_geojson"],
                "role": flight["role"],
                "operator": flight["operator"],
                "model": flight["aircraft_model"],
                "dep_time": flight["dep_time"].isoformat() if flight["dep_time"] else None,
                "in_restricted": flight["sid"] in restricted_sids  # 🚩 Флаг запретной зоны
            })

        result = {
            "region_name": full_region_name,
            "region_geom": region_geom,
            "flights": flights_data
        }

        return jsonify(result)

    except Exception as e:
        print(f"Ошибка при получении GeoJSON данных для региона {region_name}: {e}")
        cur.close()
        conn.close()
        return jsonify({"error": "Ошибка получения данных"}), 500


@app.route("/admin", methods=["GET", "POST"])
def admin_panel():
    if session.get("role") != "admin":
        return "Доступ запрещён", 403

    return render_template("admin_panel.html")


@app.route("/admin/upload", methods=["POST"])
def upload_excel():
    if session.get("role") != "admin":
        return "Доступ запрещён", 403

    file = request.files.get("file")
    if not file:
        return "Файл не выбран", 400

    filename = file.filename
    if not (filename.endswith(".xlsx") or filename.endswith(".xls")):
        return "Неверный формат файла. Разрешено только .xlsx и .xls", 400

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, secure_filename(filename))
    file.save(filepath)
    print(f"[INFO] Файл сохранён: {filepath}")

    try:
        full_parser.main_from_file(filepath)
        return "Файл обработан успешно!"
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"Ошибка при обработке: {str(e)}", 500


if __name__ == "__main__":
    app.run(debug=True)