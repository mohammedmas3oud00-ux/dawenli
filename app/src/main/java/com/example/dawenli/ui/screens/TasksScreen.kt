package com.example.dawenli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.dawenli.data.model.TaskEntity
import com.example.dawenli.ui.DawenliViewModel

@Composable
fun TasksScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val tasks by viewModel.tasks.collectAsState()
    val projects by viewModel.projects.collectAsState()

    var filterIndex by remember { mutableIntStateOf(0) }
    val filterTabs = listOf("الكل", "قيد التنفيذ", "المكتملة", "ذات الأولوية")

    val filteredTasks = when (filterIndex) {
        1 -> tasks.filter { it.status != "done" }
        2 -> tasks.filter { it.status == "done" }
        3 -> tasks.filter { it.priority == "high" && it.status != "done" }
        else -> tasks
    }

    var showAddTaskDialog by remember { mutableStateOf(false) }
    var newTaskTitle by remember { mutableStateOf("") }
    var newTaskPriority by remember { mutableStateOf("medium") }
    var newTaskEnergy by remember { mutableStateOf("medium") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddTaskDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_task_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "إضافة مهمة")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("tasks_screen")
        ) {
            TabRow(
                selectedTabIndex = filterIndex,
                modifier = Modifier.fillMaxWidth()
            ) {
                filterTabs.forEachIndexed { index, title ->
                    Tab(
                        selected = filterIndex == index,
                        onClick = { filterIndex = index },
                        text = { Text(text = title, fontWeight = FontWeight.SemiBold) }
                    )
                }
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredTasks) { task ->
                    val project = projects.find { it.id == task.projectId }
                    TaskCard(
                        task = task,
                        projectName = project?.title ?: "مشروع عام",
                        onToggle = { viewModel.toggleTaskStatus(task) }
                    )
                }
            }
        }
    }

    if (showAddTaskDialog) {
        val defaultProjectId = projects.firstOrNull()?.id ?: "proj-1"
        AlertDialog(
            onDismissRequest = { showAddTaskDialog = false },
            title = { Text("إضافة مهمة جديدة") },
            text = {
                Column {
                    OutlinedTextField(
                        value = newTaskTitle,
                        onValueChange = { newTaskTitle = it },
                        label = { Text("عنوان المهمة") },
                        modifier = Modifier.fillMaxWidth().testTag("new_task_input")
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("مستوى الأولوية:", style = MaterialTheme.typography.labelMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                        listOf("high" to "عالية", "medium" to "متوسطة", "low" to "منخفضة").forEach { (key, label) ->
                            FilterChip(
                                selected = newTaskPriority == key,
                                onClick = { newTaskPriority = key },
                                label = { Text(label) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newTaskTitle.isNotBlank()) {
                            viewModel.addTask(defaultProjectId, newTaskTitle, newTaskPriority, newTaskEnergy)
                            newTaskTitle = ""
                            showAddTaskDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_task_btn")
                ) {
                    Text("حفظ")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTaskDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun TaskCard(
    task: TaskEntity,
    projectName: String,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (task.status == "done") MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
            else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = task.status == "done",
                onCheckedChange = { onToggle() },
                modifier = Modifier.testTag("task_check_${task.id}")
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = if (task.status == "done") MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "📁 $projectName",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            PriorityBadge(priority = task.priority)
        }
    }
}
