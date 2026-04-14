import urllib.request
import urllib.error

def fetch_satellite_image(lat: float, lon: float, offset: float = 0.01) -> bytes:
    """
    Fetches a raw satellite image centered around (lat, lon) using Esri World Imagery (public REST API).
    Offset controls the bounding box size (0.01 degrees is roughly 1 sq km).
    """
    min_lon = lon - offset
    max_lon = lon + offset
    min_lat = lat - offset
    max_lat = lat + offset

    # ArcGIS REST map export API
    url = (
        "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export"
        f"?bbox={min_lon},{min_lat},{max_lon},{max_lat}"
        "&bboxSR=4326&imageSR=4326&size=512,512&format=jpg&f=image"
    )

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            image_bytes = response.read()
            return image_bytes
    except urllib.error.URLError as e:
        raise Exception(f"Failed to fetch satellite image: {str(e)}")
