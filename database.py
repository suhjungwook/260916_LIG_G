import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT DEFAULT '업무',
            priority TEXT DEFAULT '보통',
            due_date TEXT,
            completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        )
    ''')
    conn.commit()

    # 초기 샘플 데이터 시딩 (비어있을 경우)
    cursor.execute('SELECT COUNT(*) AS count FROM todos')
    count = cursor.fetchone()['count']
    if count == 0:
        sample_tasks = [
            ('[LIG DNA] 2026년 하반기 프로젝트 킥오프 회의 준비', '기획', '높음', datetime.now().strftime('%Y-%m-%d'), 1),
            ('[RPA 연계] Claude 기반 업무 자동화 파이프라인 검증', '개발', '높음', datetime.now().strftime('%Y-%m-%d'), 0),
            ('[LIG 시스템] 웹 대시보드 UI/UX 가이드라인 적용 검토', '업무', '보통', datetime.now().strftime('%Y-%m-%d'), 0),
            ('[팀 협업] DNA 투두 리스트 공유 및 스프린트 피드백 수렴', '기타', '낮음', datetime.now().strftime('%Y-%m-%d'), 0),
        ]
        cursor.executemany('''
            INSERT INTO todos (title, category, priority, due_date, completed)
            VALUES (%s, %s, %s, %s, %s)
        ''', sample_tasks)
        conn.commit()

    cursor.close()
    conn.close()

def get_todos(filter_status=None, search=None, category=None):
    conn = get_connection()
    cursor = conn.cursor()

    query = 'SELECT * FROM todos WHERE 1=1'
    params = []

    if filter_status == 'active':
        query += ' AND completed = 0'
    elif filter_status == 'completed':
        query += ' AND completed = 1'
    elif filter_status == 'high':
        query += " AND priority = '높음'"

    if category and category != 'all':
        query += ' AND category = %s'
        params.append(category)

    if search:
        query += ' AND title LIKE %s'
        params.append(f'%{search}%')

    query += " ORDER BY completed ASC, CASE priority WHEN '높음' THEN 1 WHEN '보통' THEN 2 ELSE 3 END, id DESC"

    cursor.execute(query, params)
    todos = [dict(row) for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return todos

def add_todo(title, category='업무', priority='보통', due_date=None):
    if not title or not title.strip():
        raise ValueError('할 일 제목을 입력해주세요.')

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO todos (title, category, priority, due_date, completed)
        VALUES (%s, %s, %s, %s, 0)
        RETURNING id
    ''', (title.strip(), category, priority, due_date))
    todo_id = cursor.fetchone()['id']
    conn.commit()
    cursor.close()
    conn.close()
    return get_todo_by_id(todo_id)

def get_todo_by_id(todo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM todos WHERE id = %s', (todo_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return dict(row) if row else None

def toggle_todo(todo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT completed FROM todos WHERE id = %s', (todo_id,))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        return None
    new_status = 0 if row['completed'] == 1 else 1
    cursor.execute('UPDATE todos SET completed = %s WHERE id = %s', (new_status, todo_id))
    conn.commit()
    cursor.close()
    conn.close()
    return get_todo_by_id(todo_id)

def update_todo(todo_id, title, category, priority, due_date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE todos
        SET title = %s, category = %s, priority = %s, due_date = %s
        WHERE id = %s
    ''', (title.strip(), category, priority, due_date, todo_id))
    conn.commit()
    cursor.close()
    conn.close()
    return get_todo_by_id(todo_id)

def delete_todo(todo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM todos WHERE id = %s', (todo_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    cursor.close()
    conn.close()
    return deleted

def clear_completed():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM todos WHERE completed = 1')
    count = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    return count

def get_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) AS count FROM todos')
    total = cursor.fetchone()['count']

    cursor.execute('SELECT COUNT(*) AS count FROM todos WHERE completed = 1')
    completed = cursor.fetchone()['count']

    pending = total - completed
    rate = round((completed / total * 100)) if total > 0 else 0

    cursor.close()
    conn.close()
    return {
        'total': total,
        'completed': completed,
        'pending': pending,
        'rate': rate
    }
