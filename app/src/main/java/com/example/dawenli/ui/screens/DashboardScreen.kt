package com.example.dawenli.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.dawenli.data.model.HabitEntity
import com.example.dawenli.data.model.PillarEntity
import com.example.dawenli.data.model.TaskEntity
import com.example.dawenli.ui.AppTab
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.PrayerTimeItem
import com.example.dawenli.ui.theme.*

@Composable
fun DashboardScreen(
    viewModel: DawenliViewModel,
    onNavigateTab: (AppTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val pillars by viewModel.pillars.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val habits by viewModel.habits.collectAsState()
    val prayerTimes by viewModel.prayerTimes.collectAsState()

    val pendingTasks = tasks.filter { it.status != "done" }
    val spotlightTask = pendingTasks.firstOrNull { it.priority == "high" } ?: pendingTasks.firstOrNull()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("dashboard_screen"),
        contentPadding = PaddingValues(bottom = 96.dp)
    ) {
        // 1. Header Banner
        item {
            HeaderHeroSection()
        }

        // 2. Prayer Times Card
        item {
            PrayerTimesSection(prayerTimes = prayerTimes, onIbadatClick = { onNavigateTab(AppTab.IBADAT) })
        }

        // 3. Next Best Task Spotlight
        if (spotlightTask != null) {
            item {
                NextBestTaskSpotlight(
                    task = spotlightTask,
                    onToggleDone = { viewModel.toggleTaskStatus(spotlightTask) },
                    onStartFocus = {
                        viewModel.startFocusSession(spotlightTask)
                        onNavigateTab(AppTab.FOCUS)
                    }
                )
            }
        }

        // 4. Quick Actions
        item {
            QuickActionsRow(onNavigateTab = onNavigateTab)
        }

        // 5. Pillars Progress Summary
        item {
            PillarsOverviewSection(
                pillars = pillars,
                onViewHierarchy = { onNavigateTab(AppTab.HIERARCHY) }
            )
        }

        // 6. Today's Habits
        if (habits.isNotEmpty()) {
            item {
                SectionHeader(title = "عادات اليوم المستمرة", subtitle = "ثبّت عاداتك وحافظ على الشعلة")
            }
            items(habits) { habit ->
                HabitDashboardCard(
                    habit = habit,
                    isDoneToday = habit.completedDatesCsv.contains(viewModel.todayDateKey),
                    onToggle = { viewModel.toggleHabitToday(habit) }
                )
            }
        }

        // 7. Recent Tasks
        if (pendingTasks.isNotEmpty()) {
            item {
                SectionHeader(title = "المهام ذات الأولوية", subtitle = "إنجاز المهام يرفع تقدم المشاريع والركائز تلقائيًا")
            }
            items(pendingTasks.take(4)) { task ->
                TaskDashboardItem(
                    task = task,
                    onToggle = { viewModel.toggleTaskStatus(task) }
                )
            }
        }
    }
}

@Composable
fun HeaderHeroSection() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primary,
                        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.8f)
                    )
                )
            )
            .padding(horizontal = 20.dp, vertical = 24.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "مرحبًا بك في دوّنلي",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "المنظومة الهرمية لإدارة الأولويات والعبادات",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                }
                Surface(
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.25f),
                    modifier = Modifier.size(48.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.SelfImprovement,
                            contentDescription = "Dawenli Icon",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PrayerTimesSection(prayerTimes: List<PrayerTimeItem>, onIbadatClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .clickable { onIbadatClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Mosque,
                        contentDescription = "Prayer",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "مواقيت صلاة اليوم",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = "عرض منظومة العبادات ←",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                prayerTimes.forEach { prayer ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (prayer.isNext) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                                else Color.Transparent
                            )
                            .padding(horizontal = 6.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = prayer.name,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (prayer.isNext) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = if (prayer.isNext) FontWeight.Bold else FontWeight.Normal
                        )
                        Text(
                            text = prayer.time,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = if (prayer.isNext) FontWeight.Bold else FontWeight.Medium,
                            color = if (prayer.isNext) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NextBestTaskSpotlight(
    task: TaskEntity,
    onToggleDone: () -> Unit,
    onStartFocus: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .testTag("spotlight_task_card"),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = MaterialTheme.colorScheme.primary
                ) {
                    Text(
                        text = "⭐ المهمة الأنسب الآن",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
                PriorityBadge(priority = task.priority)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = task.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            if (task.description.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = task.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onStartFocus,
                    modifier = Modifier.testTag("start_focus_btn")
                ) {
                    Icon(imageVector = Icons.Default.Timer, contentDescription = "Focus", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("ابدأ جلسة تركيز")
                }
                Spacer(modifier = Modifier.width(10.dp))
                Button(
                    onClick = onToggleDone,
                    modifier = Modifier.testTag("complete_spotlight_btn")
                ) {
                    Icon(imageVector = Icons.Default.Check, contentDescription = "Done", modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("إنجاز")
                }
            }
        }
    }
}

@Composable
fun QuickActionsRow(onNavigateTab: (AppTab) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        QuickActionButton(
            title = "جلسة تركيز",
            icon = Icons.Default.HourglassTop,
            modifier = Modifier.weight(1f),
            onClick = { onNavigateTab(AppTab.FOCUS) }
        )
        QuickActionButton(
            title = "العبادات",
            icon = Icons.Default.MenuBook,
            modifier = Modifier.weight(1f),
            onClick = { onNavigateTab(AppTab.IBADAT) }
        )
        QuickActionButton(
            title = "صندوق الأفكار",
            icon = Icons.Default.Inbox,
            modifier = Modifier.weight(1f),
            onClick = { onNavigateTab(AppTab.INBOX) }
        )
    }
}

@Composable
fun QuickActionButton(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier
            .height(56.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp,
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(imageVector = icon, contentDescription = title, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(text = title, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun PillarsOverviewSection(pillars: List<PillarEntity>, onViewHierarchy: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = "ركائز الحياة", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(text = "التقدم العام يُحسب تصاعديًا من المهام والمشاريع", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            TextButton(onClick = onViewHierarchy) {
                Text("عرض المنظومة ←")
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(pillars) { pillar ->
                PillarProgressCard(pillar = pillar)
            }
        }
    }
}

@Composable
fun PillarProgressCard(pillar: PillarEntity) {
    Card(
        modifier = Modifier
            .width(220.dp)
            .height(140.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = pillar.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = pillar.purpose,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "نسبة الإنجاز", style = MaterialTheme.typography.labelSmall)
                    Text(text = "${pillar.progress}%", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressIndicator(
                    progress = { pillar.progress / 100f },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
            }
        }
    }
}

@Composable
fun HabitDashboardCard(habit: HabitEntity, isDoneToday: Boolean, onToggle: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .clickable { onToggle() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isDoneToday) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)
            else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                FilledIconToggleButton(
                    checked = isDoneToday,
                    onCheckedChange = { onToggle() },
                    modifier = Modifier.size(38.dp)
                ) {
                    Icon(
                        imageVector = if (isDoneToday) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                        contentDescription = "Toggle Habit",
                        tint = if (isDoneToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = habit.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text(text = "التكرار: ${habit.frequency}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
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
        }
    }
}

@Composable
fun TaskDashboardItem(task: TaskEntity, onToggle: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = task.status == "done",
                onCheckedChange = { onToggle() }
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                if (task.description.isNotBlank()) {
                    Text(
                        text = task.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            PriorityBadge(priority = task.priority)
        }
    }
}

@Composable
fun PriorityBadge(priority: String) {
    val (color, text) = when (priority) {
        "high" -> CoralPriority to "عالية"
        "low" -> GreenSuccess to "منخفضة"
        else -> AmberAccent to "متوسطة"
    }
    Surface(
        shape = RoundedCornerShape(6.dp),
        color = color.copy(alpha = 0.15f)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
fun SectionHeader(title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
