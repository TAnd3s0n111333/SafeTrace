from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from pydantic import BaseModel
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc)
    allow_headers=["*"],  # Allows all headers
)

# 1. Load your custom model
model = YOLO("best.pt")

# 2. Correct the Mapping (Strings from UI -> IDs for YOLO)
# Check model.names to ensure these IDs match your 'best.pt' labels
PPE_MAPPING = {
    'none': 5, 
    'Person': 6, 
    'no_helmet': 7, 
    'no_goggle': 8, 
    'no_gloves': 9, 
    'no_boots': 10
}

# List of classes and IDs of "mishaps"
Mishaps = {
    'none': 5, 
    'no_helmet': 7, 
    'no_goggle': 8, 
    'no_gloves': 9, 
    'no_boots': 10
}

# Counter used to determine amount of frames so far (for calculation of net safety score)
number_of_safety_scores_calculated = 0
Net_safety_score = 0
total_frame_safety_scores = []

# Default to showing everything at the start
active_class_ids = [5, 6, 7, 8, 9, 10]

class ClassUpdate(BaseModel):
    classes: list[str]

# Use a global variable so both the generator and the API endpoint can see it
current_display_score = 1.0 
number_of_safety_scores_calculated = 0
total_score_sum = 0.0

@app.get("/safety-score")
async def get_safety_score():
    # This is what React will call every second
    global current_display_score
    return {"score": current_display_score}

def generate_frames():
    global current_display_score, number_of_safety_scores_calculated, total_score_sum
    id_of_person_class_in_model = 6
    cap = cv2.VideoCapture("http://192.168.0.156:5000/video_feed")
    
    while True:
        success, frame = cap.read()
        if not success: break
        
        results = model.predict(frame, classes=active_class_ids, conf=0.5, verbose=False)
        
        # --- SAFETY SCORE LOGIC ---
        detected_classes = results[0].boxes.cls.tolist()
        
        if id_of_person_class_in_model in detected_classes:
            # Your Logic: 1 - (mishaps found / total possible mishaps)
            # We count how many detected items are actually in the Mishaps list
            mishap_count = len([d for d in detected_classes if d in Mishaps.values()])
            
            frame_score = 1.0 - (mishap_count / len(Mishaps))
            
            # Running Average Calculation
            number_of_safety_scores_calculated += 1
            total_score_sum += frame_score
            current_display_score = total_score_sum / number_of_safety_scores_calculated
        
        # Draw and encode
        annotated_frame = results[0].plot()
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

def Update_net_safety_score (detected_classes):
    global Mishaps, number_of_safety_scores_calculated, Net_safety_score

    # Minusing 1 from detected classes since person would be in there,
    # and person isn't a Mishap

    safety_score_for_frame = 1 - ((len(detected_classes)  - 1)/ len(Mishaps))

    # Inc. number of safety scores caluclated and the list of all calucated safety scores for that frame
    number_of_safety_scores_calculated += 1
    total_frame_safety_scores.append(safety_score_for_frame)

    # Updating Net Safety score
    Net_safety_score = sum(total_frame_safety_scores) / number_of_safety_scores_calculated
    return 0

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")