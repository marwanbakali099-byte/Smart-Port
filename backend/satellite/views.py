import os
import requests
import base64
import cv2
import numpy as np
from dotenv import load_dotenv

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Charger les variables d'environnement
load_dotenv()

class SatelliteDetectionView(APIView):
    """
    Vue pour détecter des bateaux via Mapbox (statique) ou Upload, 
    utilisant Roboflow pour l'IA et OpenCV pour le dessin des boîtes.
    """

    def post(self, request):
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        file_obj = request.data.get('image')

        # --- 1. RÉCUPÉRATION DE L'IMAGE (MAPBOX OU UPLOAD) ---
        if lat and lon:
            # Récupération sécurisée du token Mapbox
            mapbox_token = os.getenv('MAPBOX_ACCESS_TOKEN')
            if not mapbox_token:
                return Response({"error": "Configuration Mapbox manquante (TOKEN)"}, status=500)

            zoom = 15  # Zoom optimisé pour la détection de navires
            url = f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lon},{lat},{zoom},0/1024x1024?access_token={mapbox_token}"
            
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    return Response({"error": "Impossible de récupérer l'image Mapbox. Vérifiez le token ou les coordonnées."}, status=400)
                image_content = response.content
                file_name = f"sat_{lat}_{lon}.jpg"
            except Exception as e:
                return Response({"error": f"Erreur de connexion Mapbox: {str(e)}"}, status=500)
        
        elif file_obj:
            image_content = file_obj.read()
            file_name = "uploaded_sat_image.jpg"
        else:
            return Response({"error": "Veuillez fournir 'lat'/'lon' ou une image directe."}, status=400)

        # --- 2. INFÉRENCE AVEC ROBOFLOW (CLOUD AI) ---
        # Encodage en Base64 pour l'envoi à l'API Roboflow
        image_base64 = base64.b64encode(image_content).decode("utf-8")
        
        # Configuration Roboflow via variables d'environnement
        rf_api_key = os.getenv('ROBOFLOW_API_KEY')
        rf_model = os.getenv('ROBOFLOW_MODEL')
        
        if not rf_api_key or not rf_model:
            return Response({"error": "Configuration Roboflow manquante"}, status=500)

        rf_url = f"https://detect.roboflow.com/{rf_model}?api_key={rf_api_key}&confidence=20"

        try:
            rf_res = requests.post(
                rf_url, 
                data=image_base64, 
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            predictions = rf_res.json().get('predictions', [])
        except Exception as e:
            return Response({"error": f"Erreur lors de l'appel Roboflow: {str(e)}"}, status=500)

        # --- 3. DESSIN DES RÉSULTATS AVEC OPENCV ---
        # Conversion du binaire en format OpenCV
        nparr = np.frombuffer(image_content, np.uint8)
        img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        detections_finales = []
        for p in predictions:
            # Calcul des coordonnées (Roboflow donne le centre x,y)
            x1 = int(p['x'] - p['width'] / 2)
            y1 = int(p['y'] - p['height'] / 2)
            x2 = int(p['x'] + p['width'] / 2)
            y2 = int(p['y'] + p['height'] / 2)

            # Dessin du rectangle (BLEU en BGR : 255, 0, 0)
            cv2.rectangle(img_cv2, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # Label de confiance
            label = f"bateau {p['confidence']:.2f}"
            cv2.putText(img_cv2, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

            detections_finales.append({
                "class": p['class'],
                "confidence": round(p['confidence'], 3),
                "bbox": {"xmin": x1, "ymin": y1, "xmax": x2, "ymax": y2}
            })

        # --- 4. SAUVEGARDE ET RÉPONSE ---
        # On sauvegarde dans media/tmp/ pour que le frontend puisse l'afficher
        relative_path = f'tmp/{file_name}'
        full_save_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        # Création du dossier si inexistant
        os.makedirs(os.path.dirname(full_save_path), exist_ok=True)
        
        cv2.imwrite(full_save_path, img_cv2)

        return Response({
            "status": "success",
            "message": f"{len(detections_finales)} bateau(x) détecté(s)",
            "data": {
                "count": len(detections_finales),
                "detections": detections_finales,
                "processed_image_url": request.build_absolute_uri(settings.MEDIA_URL + relative_path),
                "location": {"lat": lat, "lon": lon} if lat else "upload"
            }
        }, status=status.HTTP_200_OK)