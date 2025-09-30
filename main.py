from flask import Flask, jsonify, render_template
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)

# Подключение к PostgreSQL
DB_CONFIG = {
    "dbname": "postgis_v2",
    "user": "postgres",
    "password": "qwerty",
    "host": "localhost",
    "port": 5432
}

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
    """Статистика по РПИ (районам полетной информации)"""
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


@app.route("/flights/admin_regions_stats")
def flights_admin_regions_stats():
    """Статистика по административным регионам"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            r.name AS region_name,
            COUNT(*) AS flights,  -- считаем все рейсы, даже с битым временем
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
        ORDER BY flights DESC;
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "region": row[0],
            "total_flights": row[1],
            "total_hours": round(row[2], 1)
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
        LIMIT 100
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


@app.route("/flights/top-uav-types")
def top_uav_types():
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT 
                COALESCE(NULLIF(TRIM(aircraft_type), ''), 'Не указан') as uav_type,
                COUNT(*) as count
            FROM flights
            GROUP BY COALESCE(NULLIF(TRIM(aircraft_type), ''), 'Не указан')
            ORDER BY count DESC
            LIMIT 10
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


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)