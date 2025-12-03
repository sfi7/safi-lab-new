import sys
import os
import subprocess
import importlib.util

def check_package(package_name, display_name=None):
    if display_name is None:
        display_name = package_name
    
    if importlib.util.find_spec(package_name):
        print(f"[OK] {display_name} installed")
        return True
    else:
        print(f"[MISSING] {display_name} NOT installed")
        return False

print("--- Checking Python Dependencies ---")
check_package("PyQt5")
check_package("openpyxl")
check_package("win32com", "pywin32")
check_package("qrcode")
check_package("PIL", "Pillow")
check_package("webview", "pywebview")

print("\n--- Checking System Tools ---")
# Check for Git
try:
    subprocess.run(["git", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"[OK] Git is installed")
except (FileNotFoundError, subprocess.CalledProcessError):
    print(f"[WARNING] Git is NOT installed (Sync features will not work)")

# Check for Excel
excel_path = os.path.abspath("Patients.xlsm")
if os.path.exists(excel_path):
    print(f"\n[OK] Excel file found at: {excel_path}")
    try:
        from openpyxl import load_workbook
        wb = load_workbook(excel_path, read_only=True, data_only=True)
        print("[OK] Excel file opened successfully with openpyxl")
        wb.close()
    except Exception as e:
        print(f"[ERROR] Failed to open Excel file: {e}")
else:
    print(f"[ERROR] Excel file NOT found at: {excel_path}")

