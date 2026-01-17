from flask import Flask, jsonify, request
from flask_cors import CORS
from twelvelabs import TwelveLabs
import os
from dotenv import load_dotenv
from services.video_service import start_video_indexing, index_and_segment, verify_index_configuration

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Initialize Twelve Labs client
    TWELVELABS_API_KEY = os.getenv("TWELVELABS_API_KEY")
    if not TWELVELABS_API_KEY:
        raise RuntimeError("Missing TWELVE_LABS_API_KEY env var")
    tl = TwelveLabs(api_key=TWELVELABS_API_KEY)
    
    # Verify index configuration on startup
    print("[Flask] Verifying Twelve Labs index configuration...")
    verify_index_configuration()

    @app.get("/health")
    def health():
        return {"status": "ok", "server": "Flask"}, 200
    
    @app.route('/api/hello', methods=['GET'])  # match Vite proxy prefix
    def test():
        return {"status": "success"}
    
    @app.route('/api/test-connection', methods=['GET'])
    def test_connection():
        try:
            # A simple call to list indexes to verify the API key works
            indexes = list(tl.indexes.list())
            return {"status": "connected", "index_count": len(indexes)}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500
        
    @app.route('/api/index-video', methods=['POST'])
    def handle_index_request():
        try:
            data = request.json
            print(f"[Flask] /api/index-video payload: {data}")
            video_url = data.get('videoUrl')
            lecture_id = data.get('lectureId')

            if not video_url:
                return jsonify({"error": "No video URL provided"}), 400

            # Trigger the Twelve Labs indexing process
            task_id = start_video_indexing(video_url)
            
            if task_id:
                print(f"[Flask] Indexing task started: task_id={task_id} lectureId={lecture_id}")
                return jsonify({
                    "success": True, 
                    "message": "Indexing task created", 
                    "task_id": task_id
                }), 202
            else:
                print(f"[Flask] Failed to start indexing for lectureId={lecture_id}")
                return jsonify({"error": "Failed to start indexing"}), 500
        
        except Exception as e:
            print(f"[Flask] CRITICAL ROUTE ERROR: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/segment-video", methods=["POST"])
    def segment_video():
        try:
            body = request.get_json(force=True) or {}
            video_url = body.get("videoUrl")
            lecture_id = body.get("lectureId")
            if not video_url:
                return jsonify({"error": "videoUrl is required"}), 400
            print(f"[Flask] /api/segment-video lectureId={lecture_id} started")
            segments = index_and_segment(video_url)
            print(f"[Flask] /api/segment-video lectureId={lecture_id} finished -> {len(segments)} segments")
            for i, s in enumerate(segments[:5]):
                print(f"[Flask][{i}] {s.get('start')} - {s.get('end')} :: {s.get('title')}")
            return jsonify({"lectureId": lecture_id, "segments": segments}), 200
        except Exception as e:
            print(f"[Flask] segmentation error: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/task-status", methods=["GET"])
    def task_status():
        try:
            task_id = request.args.get("taskId")
            if not task_id:
                return jsonify({"error": "taskId is required"}), 400
            task = tl.tasks.retrieve(task_id)
            return jsonify({
                "taskId": task_id,
                "status": getattr(task, "status", None),
                "assetId": getattr(task, "asset_id", None),
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
