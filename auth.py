from flask import Blueprint, render_template, request, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
from config import *
auth_bp = Blueprint("auth", __name__)

# Подключение к базе (используем то, что в main.py)
def get_db_connection():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn

# === Регистрация ===
@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"].strip().lower()
        password = request.form["password"]
        hashed = generate_password_hash(password)

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed))
            cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                        (username, hashed, "user"))
            conn.commit()
        except Exception as e:
            conn.rollback()
            return f"Ошибка: {e}"
        finally:
            cur.close()
            conn.close()

        return redirect(url_for("auth.login"))
    return render_template("register.html")

# === Логин ===
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    error = None  # сообщение об ошибке
    if request.method == "POST":
        username = request.form["username"].strip().lower()
        password = request.form["password"]

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, password, role FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and check_password_hash(user[1], password):
            session["user_id"] = user[0]
            session["username"] = username
            session["role"] = user[2]

            return redirect(url_for("index"))
        else:
            error = "Неверный логин или пароль!"  # сохраняем ошибку

    return render_template("login.html", error=error)


# === Выход ===
@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("auth.login"))





