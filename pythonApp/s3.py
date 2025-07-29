import os
import boto3
from concurrent.futures import ThreadPoolExecutor, as_completed

s3 = boto3.client("s3")
bucket_name = "geolabs-reports"

def file_exists_in_s3(key):
    try:
        s3.head_object(Bucket=bucket_name, Key=key)
        return True
    except s3.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        raise

def upload_file(local_path, s3_key):
    if file_exists_in_s3(s3_key):
        print(f"🔁 Skipping (already exists): {s3_key}")
        return
    print(f"⬆️ Uploading: {s3_key}")
    s3.upload_file(local_path, bucket_name, s3_key)

def upload_folder_parallel(folder_path):
    tasks = []
    with ThreadPoolExecutor(max_workers=10) as executor:  # Adjust for your system
        for root, _, files in os.walk(folder_path):
            for file in files:
                local_path = os.path.join(root, file)
                s3_key = os.path.relpath(local_path, folder_path).replace("\\", "/")
                tasks.append(executor.submit(upload_file, local_path, s3_key))
        for future in as_completed(tasks):
            future.result()  # Raise errors if any

upload_folder_parallel(r"C:\Users\tyamashita\Desktop\ALL_REPORTS")
