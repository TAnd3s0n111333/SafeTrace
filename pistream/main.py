import cv2

# Replace with your Raspberry Pi's IP and Flask route
stream_url = "http://172.20.10.2:5000/video_feed"

# OpenCV's VideoCapture can read HTTP streams (MJPEG)
cap = cv2.VideoCapture(stream_url)

if not cap.isOpened():
    print("Error: Could not open video stream.")
    exit()

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("Error: Failed to retrieve frame.")
        break

    # --- YOUR COMPUTER VISION CODE HERE ---
    # Example: Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Display the resulting frame
    cv2.imshow('Raspberry Pi Stream - CV Processing', gray)

    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()