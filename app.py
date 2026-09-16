from flask import Flask, render_template, request, jsonify
import database as db

app = Flask(__name__)

# 앱 시작 시 DB 초기화
db.init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/todos', methods=['GET'])
def get_todos():
    filter_status = request.args.get('filter', 'all')
    search = request.args.get('search', '').strip()
    category = request.args.get('category', 'all')
    
    todos = db.get_todos(filter_status=filter_status, search=search, category=category)
    return jsonify({'success': True, 'todos': todos})

@app.route('/api/todos', methods=['POST'])
def add_todo():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    category = data.get('category', '업무')
    priority = data.get('priority', '보통')
    due_date = data.get('due_date') or None

    if not title:
        return jsonify({'success': False, 'message': '할 일 내용을 입력해주세요.'}), 400

    new_todo = db.add_todo(title, category, priority, due_date)
    return jsonify({'success': True, 'todo': new_todo}), 201

@app.route('/api/todos/<int:todo_id>/toggle', methods=['PATCH'])
def toggle_todo(todo_id):
    updated = db.toggle_todo(todo_id)
    if not updated:
        return jsonify({'success': False, 'message': '해당 항목을 찾을 수 없습니다.'}), 404
    return jsonify({'success': True, 'todo': updated})

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    category = data.get('category', '업무')
    priority = data.get('priority', '보통')
    due_date = data.get('due_date') or None

    if not title:
        return jsonify({'success': False, 'message': '할 일 내용을 입력해주세요.'}), 400

    updated = db.update_todo(todo_id, title, category, priority, due_date)
    if not updated:
        return jsonify({'success': False, 'message': '해당 항목을 찾을 수 없습니다.'}), 404
    return jsonify({'success': True, 'todo': updated})

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    deleted = db.delete_todo(todo_id)
    if not deleted:
        return jsonify({'success': False, 'message': '해당 항목을 찾을 수 없습니다.'}), 404
    return jsonify({'success': True, 'message': '삭제되었습니다.'})

@app.route('/api/todos/clear-completed', methods=['POST'])
def clear_completed():
    count = db.clear_completed()
    return jsonify({'success': True, 'deleted_count': count})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    stats = db.get_stats()
    return jsonify({'success': True, 'stats': stats})

if __name__ == '__main__':
    print("=" * 50)
    print(" [LIG DNA TODO APP] 서버가 시작되었습니다.")
    print(" 로컬 주소: http://127.0.0.1:5000")
    print("=" * 50)
    app.run(host='127.0.0.1', port=5000, debug=True)
