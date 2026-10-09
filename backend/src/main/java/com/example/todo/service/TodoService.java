package com.example.todo.service;

import com.example.todo.model.Todo;
import com.example.todo.repository.TodoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TodoService {
    private final TodoRepository repository;

    public TodoService(TodoRepository repository) {
        this.repository = repository;
    }

    public List<Todo> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public Todo findById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
    }

    public Todo create(Todo todo) {
        validate(todo);
        Todo newTodo = new Todo();
        newTodo.setTitle(todo.getTitle().trim());
        newTodo.setDescription(cleanDescription(todo.getDescription()));
        newTodo.setDeadline(todo.getDeadline());
        newTodo.setCompleted(todo.isCompleted());
        return repository.save(newTodo);
    }

    public Todo update(Long id, Todo request) {
        validate(request);
        Todo todo = findById(id);
        todo.setTitle(request.getTitle().trim());
        todo.setDescription(cleanDescription(request.getDescription()));
        todo.setDeadline(request.getDeadline());
        return repository.save(todo);
    }

    public Todo toggle(Long id) {
        Todo todo = findById(id);
        todo.setCompleted(!todo.isCompleted());
        return repository.save(todo);
    }

    public void delete(Long id) {
        Todo todo = findById(id);
        repository.delete(todo);
    }

    private void validate(Todo todo) {
        if (todo.getTitle() == null || todo.getTitle().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (todo.getTitle().trim().length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must be 160 characters or fewer");
        }
        if (todo.getDescription() != null && todo.getDescription().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be 1000 characters or fewer");
        }
    }

    private String cleanDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
