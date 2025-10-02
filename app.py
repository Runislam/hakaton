from flask import Flask, render_template, request, redirect, url_for, flash
import os
from werkzeug.utils import secure_filename
import full_parser
import traceback
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"xlsx", "xls"}

app = Flask(__name__)
app.secret_key = "supersecretkey"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.debug = True

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/admin", methods=["GET", "POST"])
def admin_panel():
    if request.method == "POST":
        if "file" not in request.files:
            flash("Файл не выбран", "error")
            return redirect(request.url)
        file = request.files["file"]
        if file.filename == "":
            flash("Файл не выбран", "error")
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            try:
                print(f"[INFO] Файл сохранен: {filepath}")


                records = full_parser.parse_excel_file(filepath)
                print(f"[INFO] Распарсено записей: {len(records)}")


                full_parser.main_from_file(filepath)
                print("[INFO] Данные успешно вставлены в БД")

                flash(f"Файл обработан успешно! {len(records)} записей.", "success")
            except Exception as e:
                print("[ERROR] Ошибка при обработке файла:")
                traceback.print_exc()  # <-- вывод полного стека ошибки
                flash(f"Ошибка при обработке файла: {str(e)}", "error")
            return redirect(request.url)
        else:
            flash("Неверный формат файла. Разрешено только .xlsx и .xls", "error")
            return redirect(request.url)
    return render_template("admin.html")
