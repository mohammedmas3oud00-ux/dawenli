package com.example.dawenli.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.dawenli.data.model.*
import com.example.dawenli.ui.DawenliViewModel

@Composable
fun HierarchyScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val pillars by viewModel.pillars.collectAsState()
    val visions by viewModel.visions.collectAsState()
    val goals by viewModel.goals.collectAsState()
    val projects by viewModel.projects.collectAsState()
    val tasks by viewModel.tasks.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var dialogPillarId by remember { mutableStateOf<String?>(null) }
    var newGoalTitle by remember { mutableStateOf("") }
    var newGoalDesc by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    if (pillars.isNotEmpty()) {
                        dialogPillarId = pillars.first().id
                        showAddDialog = true
                    }
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_hierarchy_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "إضافة هدف")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("hierarchy_screen"),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "🏛️ المنظومة الهرمية للإنتاجية",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "الركائز ← الرؤى ← أهداف القيمة ← المشاريع ← المهام. يتم حساب نسب الإنجاز تصاعديًا وتلقائيًا بمجرد إنجاز المهام.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            items(pillars) { pillar ->
                val pillarVisions = visions.filter { it.pillarId == pillar.id }
                val pillarGoals = goals.filter { it.pillarId == pillar.id }

                PillarHierarchyItem(
                    pillar = pillar,
                    visions = pillarVisions,
                    goals = pillarGoals,
                    projects = projects,
                    tasks = tasks,
                    onToggleTask = { viewModel.toggleTaskStatus(it) }
                )
            }
        }
    }

    if (showAddDialog && dialogPillarId != null) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("إضافة هدف قيمة جديد") },
            text = {
                Column {
                    OutlinedTextField(
                        value = newGoalTitle,
                        onValueChange = { newGoalTitle = it },
                        label = { Text("عنوان الهدف") },
                        modifier = Modifier.fillMaxWidth().testTag("goal_title_input")
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = newGoalDesc,
                        onValueChange = { newGoalDesc = it },
                        label = { Text("الوصف / الأثر المتوقع") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newGoalTitle.isNotBlank()) {
                            viewModel.addGoal(dialogPillarId!!, newGoalTitle, newGoalDesc)
                            newGoalTitle = ""
                            newGoalDesc = ""
                            showAddDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_add_goal_btn")
                ) {
                    Text("حفظ")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun PillarHierarchyItem(
    pillar: PillarEntity,
    visions: List<VisionEntity>,
    goals: List<ValueGoalEntity>,
    projects: List<ProjectEntity>,
    tasks: List<TaskEntity>,
    onToggleTask: (TaskEntity) -> Unit
) {
    var expanded by remember { mutableStateOf(true) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Icon(
                        imageVector = if (expanded) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowLeft,
                        contentDescription = "Expand",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = pillar.title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = pillar.purpose,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                ) {
                    Text(
                        text = "${pillar.progress}%",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = { pillar.progress / 100f },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    goals.forEach { goal ->
                        val goalProjects = projects.filter { it.goalId == goal.id }
                        GoalHierarchyItem(
                            goal = goal,
                            projects = goalProjects,
                            tasks = tasks,
                            onToggleTask = onToggleTask
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun GoalHierarchyItem(
    goal: ValueGoalEntity,
    projects: List<ProjectEntity>,
    tasks: List<TaskEntity>,
    onToggleTask: (TaskEntity) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 12.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = "Expand Goal",
                        tint = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "🎯 ${goal.title}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Text(
                    text = "${goal.progress}%",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp, start = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    projects.forEach { project ->
                        val projectTasks = tasks.filter { it.projectId == project.id }
                        ProjectHierarchyItem(
                            project = project,
                            tasks = projectTasks,
                            onToggleTask = onToggleTask
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ProjectHierarchyItem(
    project: ProjectEntity,
    tasks: List<TaskEntity>,
    onToggleTask: (TaskEntity) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📁 ${project.title}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${project.progress}%",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            tasks.forEach { task ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = task.status == "done",
                        onCheckedChange = { onToggleTask(task) }
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = task.title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (task.status == "done") MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}
