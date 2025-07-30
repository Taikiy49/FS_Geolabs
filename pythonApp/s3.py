import os
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed

s3 = boto3.client("s3")
bucket_name = "geolabs-reports"

def upload_file_with_content_type(local_path, s3_key):
    try:
        print(f"⬆️ Uploading: {s3_key}")
        s3.upload_file(
            Filename=local_path,
            Bucket=bucket_name,
            Key=s3_key,
            ExtraArgs={"ContentType": "application/pdf"}  # 👈 Ensures browser preview
        )
    except Exception as e:
        print(f"❌ Failed to upload {s3_key}: {e}")

def upload_folder_parallel(folder_path):
    tasks = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        for root, _, files in os.walk(folder_path):
            for file in files:
                local_path = os.path.join(root, file)
                s3_key = os.path.relpath(local_path, folder_path).replace("\\", "/")
                tasks.append(executor.submit(upload_file_with_content_type, local_path, s3_key))
        for future in as_completed(tasks):
            future.result()

upload_folder_parallel(r"C:\Users\tyamashita\Desktop\ALL_REPORTS")
