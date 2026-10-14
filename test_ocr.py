from app.ocr.image_cropper import crop_image
from app.ocr.pdf_reader import pdf_to_images
from app.ocr.text_recognizer import extract_text


pages = pdf_to_images(
    pdf_path="data/ocr/scan.pdf",
    output_dir="data/ocr/pages_300",
    dpi=300
)

page_path = pages[0]

cropped_path = crop_image(
    image_path=page_path,
    output_path="data/ocr/question_1_300dpi.png",
    left=315,
    top=1890,
    right=2145,
    bottom=2865,
)

print("===== OCR DO RECORTE EM 300 DPI — PSM 6 =====")
print(
    extract_text(
        cropped_path,
        page_segmentation_mode=6
    )
)
