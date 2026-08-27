# Switch Live: Drag & Drop Sorting & Cross-Table Transfers

Switch Live includes a high-performance, zero-dependency **Drag & Drop Reordering and Multi-Table Transfer** system. It provides an ultra-smooth 60 FPS optimistic UI with non-blocking background server synchronization, automatic error rollbacks, grab handles, and debounced batching.

---

## 📑 Table of Contents

1. [Key Architecture & Performance Highlights](#-key-architecture--performance-highlights)
2. [Single Table / List Reordering (`switch-sortable`)](#1-single-table--list-reordering-switch-sortable)
3. [Multi-Table / Kanban Transfers (`switch-sortable-group`)](#2-multi-table--kanban-transfers-switch-sortable-group)
4. [Grab Handles & Non-Draggable Items](#3-grab-handles--non-draggable-items)
5. [Backend Controller & Action Implementation](#4-backend-controller--action-implementation)
6. [High-Performance SQL Batch Updates](#5-high-performance-sql-batch-updates)
7. [Directives & Options Reference](#6-directives--options-reference)
8. [Client-Side Events & Hooks](#7-client-side-events--hooks)
9. [Error Handling & Automatic Rollbacks](#8-error-handling--automatic-rollbacks)

---

## ⚡ Key Architecture & Performance Highlights

Traditional web applications freeze or lag during drag-and-drop operations because they either block the UI while waiting for the server, or re-render large HTML fragments on every drop.

Switch Live solves this with a **4-step optimistic pipeline**:

```
[User Drops Item] ───> 1. DOM Moves Instantly (0ms Lag, 60 FPS)
                               │
                               ▼
                       2. Debounced Background Sync (< 250ms)
                               │
                               ▼
                       3. Sub-Kilobyte JSON Payload (IDs only)
                               │
                               ├─── [HTTP 200/204] ──> Emits 'switch:sorted' event
                               └─── [HTTP 4xx/5xx] ──> Auto-Reverts DOM & Toasts Error
```

- **Optimistic UI:** The DOM element reorders instantly under the user's cursor without waiting for network latency.
- **Microsecond SQL Update:** The backend only receives the reordered ID list and applies an in-memory or indexed batch update in `< 2ms`.
- **Automatic Rollback:** If the network fails or permissions are denied, the item seamlessly animates back to its original slot with a flash error toast.

---

## 1. Single Table / List Reordering (`switch-sortable`)

To make any HTML `<table>`, `<tbody>`, `<ul>`, or `<ol>` sortable, attach `switch-sortable="[endpoint]"`.

### Example: Sortable Table Rows

```html
<table class="table">
    <thead>
        <tr>
            <th>Order</th>
            <th>Title</th>
            <th>Status</th>
        </tr>
    </thead>
    <!-- Attach switch-sortable to tbody -->
    <tbody switch-sortable="/api/posts/reorder" switch-debounce="250">
        @foreach($posts as $post)
            <tr data-id="{{ $post->id }}">
                <td class="cursor-grab">☰</td>
                <td>{{ $post->title }}</td>
                <td><span class="badge">{{ $post->status }}</span></td>
            </tr>
        @endforeach
    </tbody>
</table>
```

---

## 2. Multi-Table / Kanban Transfers (`switch-sortable-group`)

To allow dragging items **between different tables, columns, or cards** (e.g. Kanban boards, Task managers, Order stages), assign them matching `switch-sortable-group` attributes and unique `data-group` values.

### Example: Kanban Board

```html
<div class="grid grid-cols-3 gap-6">

    <!-- Column 1: Backlog -->
    <div class="card">
        <h3>📋 Backlog</h3>
        <div class="task-list"
             switch-sortable-group="kanban"
             data-group="backlog"
             switch-action="/api/tasks/move"
             switch-debounce="300">
            @foreach($backlogTasks as $task)
                <div class="task-card" data-id="{{ $task->id }}">
                    <h4>{{ $task->title }}</h4>
                    <p>{{ $task->assigned_to }}</p>
                </div>
            @endforeach
        </div>
    </div>

    <!-- Column 2: In Progress -->
    <div class="card">
        <h3>⚡ In Progress</h3>
        <div class="task-list"
             switch-sortable-group="kanban"
             data-group="in_progress"
             switch-action="/api/tasks/move"
             switch-debounce="300">
            @foreach($inProgressTasks as $task)
                <div class="task-card" data-id="{{ $task->id }}">
                    <h4>{{ $task->title }}</h4>
                    <p>{{ $task->assigned_to }}</p>
                </div>
            @endforeach
        </div>
    </div>

    <!-- Column 3: Completed -->
    <div class="card">
        <h3>✅ Completed</h3>
        <div class="task-list"
             switch-sortable-group="kanban"
             data-group="completed"
             switch-action="/api/tasks/move"
             switch-debounce="300">
            @foreach($completedTasks as $task)
                <div class="task-card" data-id="{{ $task->id }}">
                    <h4>{{ $task->title }}</h4>
                    <p>{{ $task->assigned_to }}</p>
                </div>
            @endforeach
        </div>
    </div>

</div>
```

---

## 3. Grab Handles & Non-Draggable Items

### Using a Grab Handle (`switch-handle`)
If you only want users to drag an item by clicking a specific handle icon rather than the entire row:

```html
<ul switch-sortable="/api/menu/reorder" switch-handle=".drag-handle">
    @foreach($menuItems as $item)
        <li data-id="{{ $item->id }}">
            <span class="drag-handle cursor-grab">⋮⋮</span>
            <span>{{ $item->label }}</span>
            <button onclick="editItem({{ $item->id }})">Edit</button>
        </li>
    @endforeach
</ul>
```

### Excluding Specific Items (`switch-no-drag`)
To make specific header/footer rows non-draggable:

```html
<tbody switch-sortable="/api/items/reorder">
    <tr switch-no-drag class="bg-gray-100 font-bold">
        <td colspan="3">📌 Pinned Category Header</td>
    </tr>
    <tr data-id="1"><td>Item 1</td></tr>
    <tr data-id="2"><td>Item 2</td></tr>
</tbody>
```

---

## 4. Backend Controller & Action Implementation

When an item is dropped or moved, Switch Live dispatches a lightweight JSON `POST` request with the following structure:

```json
{
  "id": 42,
  "source_group": "in_progress",
  "target_group": "completed",
  "ids": ["10", "42", "15", "8"],
  "order": ["10", "42", "15", "8"],
  "old_index": 0,
  "new_index": 1
}
```

### 1. Single Table Reordering Action (`app/Actions/ReorderPostsAction.php`)
```php
<?php

declare(strict_types=1);

namespace App\Actions;

use Switch\Foundation\Action\Action;
use App\Models\Post;

class ReorderPostsAction extends Action
{
    public function rules(): array
    {
        return [
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ];
    }

    public function handle(array $data): array
    {
        db()->transaction(function () use ($data) {
            foreach ($data['ids'] as $position => $id) {
                Post::query()->where('id', $id)->update(['sort_order' => $position + 1]);
            }
        });

        return ['success' => true];
    }
}
```

### 2. Multi-Table / Kanban Transfer Controller (`app/Controllers/TaskController.php`)
```php
<?php

declare(strict_types=1);

namespace App\Controllers;

use Switch\Http\ServerRequest;
use Switch\Http\Response;
use Switch\Live\LiveResponse;
use App\Models\Task;

class TaskController
{
    public function move(ServerRequest $request): Response
    {
        $body = $request->getParsedBody();
        $taskId      = (int) ($body['id'] ?? 0);
        $targetGroup = (string) ($body['target_group'] ?? '');
        $newOrder    = (array) ($body['order'] ?? []);

        db()->transaction(function () use ($taskId, $targetGroup, $newOrder) {
            // 1. Update task status/stage
            if ($taskId > 0 && !empty($targetGroup)) {
                Task::query()->where('id', $taskId)->update(['status' => $targetGroup]);
            }

            // 2. Re-index new order in the target container
            foreach ($newOrder as $index => $id) {
                Task::query()->where('id', (int) $id)->update(['sort_order' => $index + 1]);
            }
        });

        // 3. Optional live toast notification
        LiveResponse::toast("Task status updated to " . ucfirst($targetGroup), "success");

        return response()->json(['success' => true]);
    }
}
```

---

## 5. High-Performance SQL Batch Updates

For high-traffic tables with 100+ items, you can execute the entire sort order update in a **single SQL query** using SQL `CASE ... WHEN`:

```php
public function batchReorder(array $orderedIds): void
{
    if (empty($orderedIds)) return;

    $cases = [];
    $params = [];

    foreach ($orderedIds as $index => $id) {
        $cases[] = "WHEN id = ? THEN ?";
        $params[] = (int) $id;
        $params[] = $index + 1;
    }

    $idsList = implode(',', array_map('intval', $orderedIds));
    $sql = "UPDATE tasks SET sort_order = CASE " . implode(' ', $cases) . " END WHERE id IN ({$idsList})";

    db()->statement($sql, $params);
}
```

> [!TIP]
> Always add an index to your ordering columns:
> ```sql
> CREATE INDEX idx_tasks_status_order ON tasks (status, sort_order);
> ```

---

## 6. Directives & Options Reference

| Attribute | Target | Description | Example |
| :--- | :--- | :--- | :--- |
| `switch-sortable` | Container | Enables drag-and-drop sorting for child elements. Accepts sync URL endpoint. | `switch-sortable="/api/posts/reorder"` |
| `switch-sortable-group` | Container | Assigns a group identifier for cross-container / multi-table dragging. | `switch-sortable-group="kanban"` |
| `data-group` | Container | Specifies the group/status name sent in payload (`source_group` / `target_group`). | `data-group="in_progress"` |
| `switch-handle` | Container | CSS selector specifying the handle element required to initiate drag. | `switch-handle=".drag-handle"` |
| `switch-debounce` | Container | Debounce timeout in milliseconds before network sync (default: `250ms`). | `switch-debounce="300"` |
| `data-id` | Child Item | Unique identifier of the draggable row or card. | `data-id="{{ $item->id }}"` |
| `switch-no-drag` | Child Item | Prevents this specific child from being dragged or reordered. | `<tr switch-no-drag>...</tr>` |

---

## 7. Client-Side Events & Hooks

Switch Live emits standard DOM custom events during every stage of the drag-and-drop lifecycle:

```javascript
// Triggered when dragging starts
document.addEventListener('switch:sort:start', function (e) {
    console.log('Dragging item:', e.detail.id, e.detail.item);
});

// Triggered when position changes in the DOM
document.addEventListener('switch:sort:change', function (e) {
    console.log('New order in DOM:', e.detail.order);
});

// Triggered after server successfully confirms the reorder
document.addEventListener('switch:sorted', function (e) {
    console.log('Server synced:', e.detail);
});

// Triggered if server rejects or network fails
document.addEventListener('switch:sort:error', function (e) {
    console.error('Sort sync failed, DOM reverted:', e.detail.error);
});
```

---

## 8. Error Handling & Automatic Rollbacks

If a server returns a `400`, `403`, `500` error or the user's connection drops:
1. The dragged item is **automatically moved back** to its original container and index.
2. A red toast notification is displayed: `"Failed to update sort order. Changes reverted."`
3. A `switch:sort:error` event is dispatched.

Zero extra client-side code is needed—the resilience is built directly into Switch Live.
