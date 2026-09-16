/**
 * LIG DNA TaskFlow - Frontend Core Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const dueDateInput = document.getElementById('dueDateInput');

    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');

    const filterTabs = document.querySelectorAll('.filter-tab');
    const filterCategory = document.getElementById('filterCategory');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');

    // Stats
    const statTotal = document.getElementById('statTotal');
    const statPending = document.getElementById('statPending');
    const statCompleted = document.getElementById('statCompleted');
    const statRate = document.getElementById('statRate');
    const statProgressBar = document.getElementById('statProgressBar');

    // Theme & Date
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const dateText = document.getElementById('dateText');

    // Modal Elements
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editTodoId = document.getElementById('editTodoId');
    const editTitle = document.getElementById('editTitle');
    const editCategory = document.getElementById('editCategory');
    const editPriority = document.getElementById('editPriority');
    const editDueDate = document.getElementById('editDueDate');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');

    // State
    let currentFilter = 'all';
    let currentCategory = 'all';
    let searchQuery = '';
    let debounceTimer = null;

    // Initialize Date Display & Default Due Date
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    dueDateInput.value = formattedToday;
    
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    dateText.textContent = today.toLocaleDateString('ko-KR', dateOptions);

    // Initialize Theme
    const savedTheme = localStorage.getItem('lig_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('lig_theme', nextTheme);
        showToast(`${nextTheme === 'dark' ? '🌙 다크 모드' : '☀️ 라이트 모드'}로 전환되었습니다.`);
    });

    // ==========================================
    // Fetch & Render Todos
    // ==========================================
    async function loadTodos() {
        try {
            const url = new URL('/api/todos', window.location.origin);
            url.searchParams.set('filter', currentFilter);
            url.searchParams.set('category', currentCategory);
            if (searchQuery) url.searchParams.set('search', searchQuery);

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                renderTodos(data.todos);
                loadStats();
            }
        } catch (err) {
            console.error('할 일 목록 로드 실패:', err);
            showToast('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        }
    }

    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (data.success) {
                const s = data.stats;
                statTotal.textContent = s.total;
                statPending.textContent = s.pending;
                statCompleted.textContent = s.completed;
                statRate.textContent = `${s.rate}%`;
                statProgressBar.style.width = `${s.rate}%`;

                // Update Tab Counts
                const cAll = document.getElementById('countAll');
                const cActive = document.getElementById('countActive');
                const cCompleted = document.getElementById('countCompleted');
                if (cAll) cAll.textContent = s.total;
                if (cActive) cActive.textContent = s.pending;
                if (cCompleted) cCompleted.textContent = s.completed;
            }
        } catch (err) {
            console.error('통계 로드 실패:', err);
        }
    }

    function renderTodos(todos) {
        todoList.innerHTML = '';

        if (!todos || todos.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        todos.forEach(todo => {
            const item = document.createElement('div');
            item.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            item.dataset.id = todo.id;

            // D-day calculation
            let dueBadgeHtml = '';
            if (todo.due_date) {
                const dueDate = new Date(todo.due_date);
                const diffTime = dueDate.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let dDayText = '';
                let isUrgent = false;

                if (diffDays === 0) {
                    dDayText = '오늘 마감';
                    isUrgent = true;
                } else if (diffDays > 0) {
                    dDayText = `D-${diffDays}`;
                } else {
                    dDayText = `D+${Math.abs(diffDays)} 지연`;
                    isUrgent = true;
                }

                dueBadgeHtml = `
                    <span class="due-badge ${isUrgent && !todo.completed ? 'urgent' : ''}">
                        📅 ${todo.due_date} (${dDayText})
                    </span>
                `;
            }

            item.innerHTML = `
                <div class="checkbox-wrap" title="${todo.completed ? '완료 취소' : '완료 처리'}">
                    <div class="checkbox-custom">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>

                <div class="todo-body">
                    <span class="todo-title">${escapeHtml(todo.title)}</span>
                    <div class="todo-tags">
                        <span class="badge category-badge" data-cat="${escapeHtml(todo.category)}">${escapeHtml(todo.category)}</span>
                        <span class="badge priority-badge priority-${escapeHtml(todo.priority)}">${escapeHtml(todo.priority)}</span>
                        ${dueBadgeHtml}
                    </div>
                </div>

                <div class="todo-actions">
                    <button class="item-btn edit-btn" title="수정" aria-label="수정">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="item-btn delete-btn" title="삭제" aria-label="삭제">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            // Event Listeners for Item
            const checkboxWrap = item.querySelector('.checkbox-wrap');
            const todoBody = item.querySelector('.todo-body');
            const editBtn = item.querySelector('.edit-btn');
            const deleteBtn = item.querySelector('.delete-btn');

            checkboxWrap.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTodoStatus(todo.id);
            });

            todoBody.addEventListener('click', () => {
                toggleTodoStatus(todo.id);
            });

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(todo);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTodoItem(todo.id);
            });

            todoList.appendChild(item);
        });
    }

    // ==========================================
    // Add Todo
    // ==========================================
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        if (!title) return;

        const newTodoData = {
            title: title,
            category: categorySelect.value,
            priority: prioritySelect.value,
            due_date: dueDateInput.value || null
        };

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTodoData)
            });

            const data = await res.json();
            if (data.success) {
                todoInput.value = '';
                todoInput.focus();
                showToast('✨ 새로운 업무가 성공적으로 등록되었습니다.');
                loadTodos();
            } else {
                showToast(data.message || '등록에 실패했습니다.', 'error');
            }
        } catch (err) {
            console.error('할 일 추가 오류:', err);
            showToast('서버 통신 오류가 발생했습니다.', 'error');
        }
    });

    // ==========================================
    // Toggle Status
    // ==========================================
    async function toggleTodoStatus(id) {
        try {
            const res = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
            const data = await res.json();
            if (data.success) {
                const isDone = data.todo.completed === 1;
                showToast(isDone ? '🎉 업무 완료! 수고하셨습니다.' : '진행 중으로 변경되었습니다.');
                loadTodos();
            }
        } catch (err) {
            console.error('상태 변경 실패:', err);
        }
    }

    // ==========================================
    // Edit Modal
    // ==========================================
    function openEditModal(todo) {
        editTodoId.value = todo.id;
        editTitle.value = todo.title;
        editCategory.value = todo.category || '업무';
        editPriority.value = todo.priority || '보통';
        editDueDate.value = todo.due_date || '';

        editModal.classList.add('active');
        editTitle.focus();
    }

    function closeEditModal() {
        editModal.classList.remove('active');
    }

    closeModalBtn.addEventListener('click', closeEditModal);
    cancelModalBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('active')) {
            closeEditModal();
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editTodoId.value;
        const title = editTitle.value.trim();

        if (!title) return;

        const updateData = {
            title: title,
            category: editCategory.value,
            priority: editPriority.value,
            due_date: editDueDate.value || null
        };

        try {
            const res = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const data = await res.json();
            if (data.success) {
                closeEditModal();
                showToast('✏️ 업무 정보가 수정되었습니다.');
                loadTodos();
            }
        } catch (err) {
            console.error('수정 실패:', err);
        }
    });

    // ==========================================
    // Delete Todo
    // ==========================================
    async function deleteTodoItem(id) {
        if (!confirm('정말 이 업무를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('🗑️ 업무가 삭제되었습니다.');
                loadTodos();
            }
        } catch (err) {
            console.error('삭제 실패:', err);
        }
    }

    // ==========================================
    // Clear Completed
    // ==========================================
    clearCompletedBtn.addEventListener('click', async () => {
        if (!confirm('완료된 모든 업무를 일괄 정리하시겠습니까?')) return;

        try {
            const res = await fetch('/api/todos/clear-completed', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast(`🧹 완료된 항목 ${data.deleted_count}개가 정리되었습니다.`);
                loadTodos();
            }
        } catch (err) {
            console.error('완료 정리 실패:', err);
        }
    });

    // ==========================================
    // Filters & Search
    // ==========================================
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            loadTodos();
        });
    });

    filterCategory.addEventListener('change', (e) => {
        currentCategory = e.target.value;
        loadTodos();
    });

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        clearSearchBtn.style.display = val ? 'block' : 'none';

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery = val.trim();
            loadTodos();
        }, 250);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        searchQuery = '';
        loadTodos();
        searchInput.focus();
    });

    // ==========================================
    // Helper Utilities
    // ==========================================
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }

    // Initial Load
    loadTodos();
});
