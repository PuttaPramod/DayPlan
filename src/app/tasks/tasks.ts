import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule,FormsModule } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { Todo } from '../models/todo.model';
import { TodoService } from '../services/todo.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, ReactiveFormsModule,FormsModule, RouterModule],
  standalone: true,
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks {
  todoForm: FormGroup;

  todos$: Observable<Todo[]>;
  filteredTodos$: Observable<Todo[]>;

  editing = false;
  selectedTaskId: number | null = null;

  activeFilter: 'all' | 'overdue' | 'today' | 'completed' = 'all';
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title' = 'priority';
  viewMode: 'grid' | 'kanban' = 'grid';

  today: string = new Date().toISOString().split('T')[0];
  selectedForDeletion = new Set<number>();

  overdueCount = 0;
  todayCount = 0;
  totalCount = 0;

  constructor(
    private fb: FormBuilder,
    private todoService: TodoService
  ) {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      dueDate: [''],
      priority: ['medium']
    });

    this.todos$ = this.todoService.getAllTodos();
    this.filteredTodos$ = this.getFilteredAndSortedTodos();

    // Update summary counts whenever tasks change
    this.todos$.subscribe(todos => {
      this.recomputeSummaries(todos);
    });
  }

  ngOnInit(): void {
    const hasSampleData = localStorage.getItem('sampleAdded');

    if (!hasSampleData) {
      this.todos$.subscribe(todos => {
        if (todos.length === 0) {
          this.addSampleTodos();
          localStorage.setItem('sampleAdded', 'true'); // ✅ Add only once
        }
      }).unsubscribe();
    }
  }

  private addSampleTodos(): void {
    this.todoService.addTodo(
      'Review project documentation',
      'Go through all the requirements...',
      this.getFutureDateISO(1),
      'high'
    );

    this.todoService.addTodo(
      'Team meeting preparation',
      undefined,
      this.getFutureDateISO(2),
      'medium'
    );

    this.todoService.addTodo(
      'Code review',
      'Review pull requests from team members',
      undefined,
      'low'
    );
  }

  private getFutureDateISO(daysAhead: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  }

  submitTask() {
    if (this.todoForm.invalid) {
      this.todoForm.markAllAsTouched();
      return;
    }
    const data = this.todoForm.value;

    if (this.editing && this.selectedTaskId !== null) {
      this.todoService.updateTodo(this.selectedTaskId, {
        ...data,
        dueDate: data.dueDate ? data.dueDate : undefined
      });
    } else {
      this.todoService.addTodo(
        data.title,
        data.description,
        data.dueDate ? data.dueDate : undefined,
        data.priority
      );
    }
    this.todoForm.reset({ priority: 'medium' });
    this.editing = false;
    this.selectedTaskId = null;
    this.filteredTodos$ = this.getFilteredAndSortedTodos();
  }

  getFilteredAndSortedTodos(): Observable<Todo[]> {
    return this.todoService.getAllTodos().pipe(
      map(todos => {
        let filtered = todos;
        const todayISO = this.today;

        switch (this.activeFilter) {
          case 'overdue':
            filtered = todos.filter(t => t.dueDate && !t.completed && t.dueDate < todayISO);
            break;
          case 'today':
            filtered = todos.filter(t => t.dueDate === todayISO && !t.completed);
            break;
          case 'completed':
            filtered = todos.filter(t => t.completed);
            break;
          case 'all':
          default:
            filtered = todos;
        }
        return this.sortTodos(filtered);
      })
    );
  }

  sortTodos(todos: Todo[]): Todo[] {
    return [...todos].sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  toggleComplete(id: number): void {
    this.todoService.toggleComplete(id);
  }

  isOverdue(todo: Todo): boolean {
    if (!todo.dueDate || todo.completed) return false;
    return todo.dueDate < this.today;
  }

  isDueSoon(todo: Todo): boolean {
    if (!todo.dueDate || todo.completed || this.isOverdue(todo)) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const due = todo.dueDate;
    return due <= tomorrow.toISOString().split('T')[0] && due > this.today;
  }

  setFilter(filter: 'all' | 'overdue' | 'today' | 'completed'): void {
    this.activeFilter = filter;
    this.filteredTodos$ = this.getFilteredAndSortedTodos();
  }

  openEditTask(id: number): void {
    this.selectedTaskId = id;
    this.editing = true;
    this.todos$.subscribe(todos => {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        this.todoForm.patchValue({
          title: todo.title,
          description: todo.description,
          dueDate: todo.dueDate,
          priority: todo.priority
        });
      }
    }).unsubscribe();
  }

  deleteTodo(id: number): void {
    this.todoService.deleteTodo(id);
    this.selectedForDeletion.delete(id);
    this.filteredTodos$ = this.getFilteredAndSortedTodos();
  }

  onDeleteCheckboxChange(todoId: number, event: any): void {
    if (event.target.checked) {
      this.selectedForDeletion.add(todoId);
    } else {
      this.selectedForDeletion.delete(todoId);
    }
  }

  clearSelection(): void {
    this.selectedForDeletion.clear();
    document.querySelectorAll('.delete-checkbox').forEach((checkbox: any) => {
      checkbox.checked = false;
    });
  }

  deleteSelected(): void {
    if (this.selectedForDeletion.size === 0) return;
    const count = this.selectedForDeletion.size;
    const confirmMessage = count === 1
      ? 'Are you sure you want to delete this task?'
      : `Are you sure you want to delete ${count} tasks?`;
    if (confirm(confirmMessage)) {
      this.selectedForDeletion.forEach(id => {
        this.todoService.deleteTodo(id);
      });
      this.clearSelection();
      this.filteredTodos$ = this.getFilteredAndSortedTodos();
    }
  }

  recomputeSummaries(todos: Todo[]): void {
    const todayStr = this.today;
    this.overdueCount = todos.filter(t => t.dueDate && !t.completed && t.dueDate < todayStr).length;
    this.todayCount = todos.filter(t => t.dueDate === todayStr && !t.completed).length;
    this.totalCount = todos.length;
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-danger text-white';
      case 'medium': return 'bg-warning text-dark';
      case 'low': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  trackByTodo(index: number, todo: Todo): number {
    return todo.id;
  }
}
