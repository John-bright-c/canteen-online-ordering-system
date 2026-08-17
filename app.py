from flask import Flask, render_template,request,redirect,url_for,session
import os 
from dotenv import load_dotenv 
from werkzeug.utils import secure_filename
import mysql.connector
from random import randint
from decimal import Decimal
from werkzeug.security import generate_password_hash,check_password_hash
from datetime import datetime

load_dotenv()
app= Flask(__name__)


db= mysql.connector.connect(
    host="localhost",
    user="root",
    password=os.getenv("DB_PASSWORD"),
    database="ordering_system"
)

cursor = db.cursor(dictionary=True,buffered=True)


@app.route("/")
def home():
    return render_template("home.html")

app.secret_key= os.getenv("SECRET_KEY")

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "GET":
        return render_template("register.html")

    full_name = request.form["full_name"]
    register_no = request.form["register_no"]
    email = request.form["email"]
    password = request.form["password"]

    hashed_password = generate_password_hash(password)

    cursor = db.cursor()

    cursor.execute(
    "INSERT INTO register(full_name, register_no, email, password) VALUES (%s, %s, %s, %s)",
    (full_name, register_no, email, password)
)

    db.commit()

    session["user"] = full_name

    return redirect("/menu")


@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "GET":
        return render_template("login.html")

    full_name = request.form["full_name"]
    password = request.form["password"]

    cursor = db.cursor()

    cursor.execute(
        "SELECT * FROM register WHERE full_name = %s",
        (full_name,)
    )

    user = cursor.fetchone()

    if user and user[3] == password:
        session["user"] = full_name
        session["register_no"]=user[1]
        return redirect("/menu")
    else:
        return "Invalid username or password"


#@app.route('/menu/<category>')
#@app.route('/menu')
#def menu(category="All"):
    cursor=db.cursor(dictionary=True)
    if category == "All":
        cursor.execute("Select id,name,price,category,image from products")
    else:
        cursor.execute("Select id,name,price,category,image from products where category =%s",(category,))
        products =cursor.fetchall()
        return render_template("menu.html",products=products,category=category)


@app.route('/menu', methods=["GET","POST"])
def menu():
    if "user" not in session:
        return redirect("/login")
    if request.method == "POST":
        category = request.form.get("category")
        search = request.form.get("search")

        if search:
            query = """ select id,name,price,category,image from products where name like %s """
            cursor.execute(query,("%"+ search + "%",))

        elif category == "All":
            query = "select id,name,price,category,image from products"
            cursor.execute(query) 

        elif category != "All":
            query = """select id,name,price,category,image from products where category = %s"""
            cursor.execute(query,(category,))
    else:
        query = ("select id,name , price, category, image FROM products")
        cursor.execute(query)
    products = cursor.fetchall()
    return render_template("menu.html",products = products)


@app.route("/add_to_cart", methods=["POST"])
def add_to_cart():
    print(request.form)
    product_name= request.form.get("product_name")
    price=request.form.get("price")
    print("Product: ",product_name)
    print("Price: ",price)

    cursor.execute(
        "insert into cart(product_name,price,quantity,total) values(%s,%s, %s, %s)",(product_name,price,1,price)
    )
    db.commit()
    return redirect("/cart")



@app.route("/increase/<int:id>")
def increase(id):
    cursor.execute(""" update cart set quantity = quantity+1,total=price*(quantity+1) 
    where id = %s""",(id,))
    db.commit
    return redirect("/cart")

@app.route("/decrease/<int:id>")
def decrease(id):
    cursor.execute(""" update cart set quantity = quantity-1,total=price*(quantity-1) 
    where id = %s and quantity > 1""",(id,))
    db.commit
    return redirect("/cart")

@app.route("/remove/<int:id>")
def remove(id):
    cursor.execute("delete from cart where id = %s", (id,))
    db.commit()
    return redirect("/cart")


@app.route("/cart")
def cart():
    cursor.execute("select *from cart")
    cart_items= cursor.fetchall()

    subtotal = float(sum(item["total"] for item in cart_items))
    tax = subtotal*0.05
    grand_total=subtotal+tax
    return render_template("cart.html",cart_items=cart_items,subtotal=subtotal,tax=tax,grand_total=grand_total)
    

@app.route("/checkout")
def checkout():
    cursor.execute("select *from cart")
    cart_items=cursor.fetchall()
    subtotal=float(sum(item["total"] for item in cart_items))
    tax = round(subtotal * 0.05, 2)
    grand_total = subtotal + tax
    return render_template("checkout.html" , cart_items=cart_items,subtotal=subtotal,tax=tax,grand_total=grand_total)



@app.route("/confirm_order", methods=["POST"]) 
def confirm_orders(): 
    token = randint(100, 999) 
    register_no = session["register_no"]
    cursor.execute("SELECT * FROM cart") 
    cart_items = cursor.fetchall() 
    for item in cart_items: cursor.execute(""" INSERT INTO orders 
    (register_no,token_no, product_name, price, quantity, total, order_status)
    VALUES (%s, %s, %s, %s, %s, %s, %s) """,( 
        register_no,
        token, 
        item["product_name"], 
        item["price"], 
        item["quantity"], 
        item["total"], "Preparing" 
        ))
    cursor.execute("delete from cart")
    db.commit()
    return render_template("confirm_order.html",token=token,cart_items=cart_items)



@app.route("/orders")
def orders():
    if "user" not in session:
        return redirect("/login")
    register_no= session["register_no"]
    cursor.execute("""select token_no,max(order_date) as order_date,date_format(max(order_time),'%h:%i %p') as order_time,group_concat(concat(quantity, ' ', product_name)
    separator ', ') as product_name, sum(quantity) as quantity, round(sum(total) * 1.05, 2)
    as total, max(order_status) as order_status from orders where register_no = %s 
    group by token_no order by max(order_id) desc""",(register_no,))
    orders= cursor.fetchall()
    return render_template("orders.html",orders=orders)



@app.route("/admin",methods=["GET","POST"])
def admin():
    if request.method == "POST":
        username=request.form["username"]
        password=request.form["password"]

        if username == "johnny" and password == "bbjbg2258":
            return redirect("/admin_dashboard")
        else:
            return "Invalid Username or Password"
    return render_template("admin.html")


@app.route("/admin_dashboard")
def admin_dashboard():
    cursor.execute("""select token_no,max(order_date) as order_date,date_format(max(order_time),'%h:%i %p') as order_time,group_concat(concat(quantity, ' ', product_name) separator ', ') as product_name, sum(quantity) as quantity, round(sum(total) * 1.05, 2) as total, max(order_status) as order_status from orders group by token_no order by max(order_id) desc""")
    orders = cursor.fetchall()
    today = datetime.now()
    
    cursor.execute("select count(distinct token_no) as total_orders from orders")
    total_orders= cursor.fetchone()
    ["total_orders"]

    cursor.execute("select count(distinct token_no) as pending_orders from orders where order_status ='Preparing'")
    pending_orders = cursor.fetchone()
    ["pending_orders"]

    cursor.execute("select count(*) as ready_orders from orders where order_status ='Ready'")
    ready_orders = cursor.fetchone()
    ["ready_orders"]

    cursor.execute("select round(sum(total) * 1.05,2) as revenue from orders")
    revenue=cursor.fetchone()
    ["revenue"] or 0

    cursor.execute("""select product_name,sum(quantity) as total_sold from orders group by product_name order by total_sold desc limit 5""")
    top_products = cursor.fetchall()

    return render_template("admin_dashboard.html",day=today.strftime("%A"),date=today.strftime("%d %B %Y"), total_orders=total_orders, pending_orders=pending_orders,ready_orders=ready_orders, revenue=revenue ,orders=orders,top_products=top_products)


@app.route("/update_status",methods=["POST"])
def update_status():
    token = request.form["token"]
    status=request.form["status"]

    cursor.execute("update orders set order_status=%s where token_no=%s",(status, token))
    db.commit()
    return redirect (url_for("manage_orders"))

@app.route("/manage_orders")
def manage_orders():
    cursor.execute("""select token_no, group_concat(concat(quantity, ' ', product_name) separator ', ') as product_name, sum(quantity) as quantity, round(sum(total) * 1.05, 2) as total, max(order_status) as order_status from orders group by token_no order by max(order_id) desc""")
    orders=cursor.fetchall()
    return render_template("manage_orders.html",orders=orders)

@app.route("/edit_menu")
def edit_menu():
    cursor.execute("select * from products")
    foods = cursor.fetchall()
    return render_template("edit_menu.html",foods = foods)

@app.route("/edit/<int:id>", methods=["GET", "POST"])
def edit(id):

    if request.method == "POST":
        name = request.form["name"]
        price = request.form["price"]
        category = request.form["category"]
        image_file = request.files.get("image")

        if image_file and image_file.filename:
            filename = secure_filename(image_file.filename)
            image_file.save(
                os.path.join(app.root_path, "static", "images", filename)
            )

            cursor.execute(
                """UPDATE products
                   SET name=%s, price=%s, category=%s, image=%s
                   WHERE id=%s""",
                (name, price, category, filename, id)
            )
        else:
            cursor.execute(
                """UPDATE products
                   SET name=%s, price=%s, category=%s
                   WHERE id=%s""",
                (name, price, category, id)
            )

        db.commit()
        return redirect("/edit_menu")

    cursor.execute(
        "SELECT * FROM products WHERE id=%s", (id,)
    )
    food = cursor.fetchone()

    return render_template("edit_product.html", food=food)

@app.route("/remove_product/<int:id>")
def remove_product(id):
    cursor.execute("delete from products where id = %s", (id,))
    db.commit()
    return redirect("/edit_menu")

@app.route("/admin_add_product" ,methods=["POST","GET"])
def admin_add_product():
    if request.method == "POST":
        name = request.form["name"]
        price=request.form["price"]
        category=request.form["category"]
        image_file=request.files["image"]

        if image_file: 
            filename = secure_filename(image_file.filename)
        image_file.save(os.path.join(app.root_path,"static","images", filename))
        cursor.execute("Insert into products (name,price,category,image) values (%s,%s,%s,%s)",(name,price,category,filename))
        db.commit()
        return redirect("/edit_menu")

    return render_template("admin_add_product.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  


    