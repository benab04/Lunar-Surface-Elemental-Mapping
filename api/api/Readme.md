# Django Project Setup Guide

This guide will walk you through setting up a Django project from scratch. All the dependencies required for the project are listed in the `requirements.txt` file.

## Prerequisites

Before you start, ensure that you have the following installed:

- **Python** (version 3.6 or above)
- **pip** (Python's package installer)
- **Virtual Environment (optional, but recommended)**

### Step 1: Set Up a Virtual Environment (Optional but Recommended)

It's highly recommended to use a virtual environment to isolate project dependencies. To set it up, follow these steps:

#### Create a virtual environment:

For **Windows**:

```bash
python -m venv venv
```

For **macOS/Linux**:

```bash
python3 -m venv venv
```

#### Activate the virtual environment:

- **Windows**:

```bash
.\venv\Scripts\activate
```

- **macOS/Linux**:

```bash
source venv/bin/activate
```

You should now see `(venv)` at the beginning of your command prompt, indicating that the virtual environment is active.

### Step 2: Install Dependencies

With your virtual environment activated, install the project dependencies listed in the `requirements.txt` file by running:

```bash
pip install -r requirements.txt
```

This will install all the necessary Python packages for the project.

### Step 3: Set Up the Database

Once the dependencies are installed, you'll need to set up your database. Django uses SQLite by default, but you can change the database configuration in the `settings.py` file if you're using a different database.

Run the following command to create the initial database and apply any migrations:

```bash
python manage.py migrate
```

This will set up the database schema.

### Step 4: Create a Superuser (Optional)

To access the Django admin panel, you need a superuser account. Create one by running:

```bash
python manage.py createsuperuser
```

Follow the prompts to create a username, email, and password for your superuser.

### Step 5: Run the Development Server

Once everything is set up, you can start the Django development server with:

```bash
python manage.py runserver
```

The server should now be running at `http://127.0.0.1:8000/`. You can access your site and the Django admin panel (by going to `http://127.0.0.1:8000/admin/`) using the superuser credentials you created.

### Step 6: Verify Everything is Working

Open your browser and navigate to `http://127.0.0.1:8000/`. If the Django welcome page appears, everything is set up correctly!

---

## Additional Notes

- If you're using a database other than SQLite (e.g., PostgreSQL, MySQL), make sure to update the `DATABASES` setting in your `settings.py` file.
- If the project uses any front-end or JavaScript tools, make sure to install those dependencies as well (e.g., with `npm install` or similar).
- You may need to set up environment variables (e.g., `SECRET_KEY`, `DEBUG`, etc.). You can configure these in the `settings.py` or through a `.env` file (depending on your project's configuration).

---

## Troubleshooting

- **Missing `requirements.txt` file**: Ensure that you're in the correct project directory, and that the file exists. If not, you'll need to recreate it or get it from the project's repository.
- **Database Errors**: If you encounter errors related to the database, double-check your database configurations in `settings.py` and ensure the database server is running if you're using an external database.

- **Missing Dependencies**: If a specific package is missing or there are version conflicts, try upgrading your `pip` and reinstalling the dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Conclusion

You now have the Django project set up and running locally! From here, you can start developing your app, adding new features, and configuring your project further to fit your needs.
