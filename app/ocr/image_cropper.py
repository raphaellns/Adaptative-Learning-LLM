from PIL import Image


def crop_image(
    image_path: str,
    output_path: str,
    left: int,
    top: int,
    right: int,
    bottom: int
):
    image = Image.open(image_path)

    cropped = image.crop(
        (left, top, right, bottom)
    )

    cropped.save(output_path)

    return output_path