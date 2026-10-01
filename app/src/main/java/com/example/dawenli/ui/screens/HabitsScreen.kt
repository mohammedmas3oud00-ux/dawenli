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
import androidx.compose.ui.unit.sp
import com.example.dawenli.data.model.HabitEntity
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.theme.AmberAccent

@Composable
fun HabitsScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val habits by viewModel.habits.collectAsState()
    val pillars by viewModel.pillars.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var newHabitTitle by remember { mutableStateOf("") }
    var newHabitFreq by remember { mutableStateOf("daily") }
    var newHabitTime by remember { mutableStateOf("morning") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_habit_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "إضافة عادة")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("habits_screen"),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = AmberAccent.copy(alpha = 0.15f)
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "🔥 منظومة العادات والاستمرارية",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = AmberAccent
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "العادات الصغيرة المستمرة هي سر التحولات الكبرى. حافظ على الشعلة يوميًا.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            items(habits) { habit ->
                val isDoneToday = habit.completedDatesCsv.contains(viewModel.todayDateKey)
                HabitCardItem(
                    habit = habit,
                    isDoneToday = isDoneToday,
                    onToggle = { viewModel.toggleHabitToday(habit) }
                )
            }
        }
    }

    if (showAddDialog) {
        val defaultPillarId = pillars.firstOrNull()?.id ?: "pillar-1"
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("إضافة عادة جديدة") },
            text = {
                Column {
                    OutlinedTextField(
                        value = newHabitTitle,
                        onValueChange = { newHabitTitle = it },
                        label = { Text("عنوان العادة") },
                        modifier = Modifier.fillMaxWidth().testTag("new_habit_input")
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("التوقيت المقترح:", style = MaterialTheme.typography.labelMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                        listOf("morning" to "صباحًا", "evening" to "مساءً", "anytime" to "أي وقت").forEach { (key, label) ->
                            FilterChip(
                                selected = newHabitTime == key,
                                onClick = { newHabitTime = key },
                                label = { Text(label) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newHabitTitle.isNotBlank()) {
                            viewModel.addHabit(defaultPillarId, newHabitTitle, newHabitFreq, newHabitTime)
                            newHabitTitle = ""
                            showAddDialog = false
                        }
                    },
                    modifier = Modifier.testTag("confirm_habit_btn")
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
fun HabitCardItem(
    habit: HabitEntity,
    isDoneToday: Boolean,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isDoneToday) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)
            else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Button(
                    onClick = onToggle,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isDoneToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (isDoneToday) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.size(44.dp),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text(text = if (isDoneToday) "✓" else "+", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = habit.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "الوقت: ${habit.timeOfDay} • التكرار: ${habit.frequency}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = AmberAccent.copy(alpha = 0.15f)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "🔥", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${habit.currentStreak} يوم",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = AmberAccent
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "الأعلى: ${habit.longestStreak}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
