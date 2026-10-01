package com.example.dawenli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.dawenli.data.model.TimeBlockEntity
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.theme.EmeraldPrimaryLight
import com.example.dawenli.ui.theme.GreenSuccess
import com.example.dawenli.ui.theme.PurpleAccent

@Composable
fun TimeBlockingScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val blocks by viewModel.todayTimeBlocks.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var blockTitle by remember { mutableStateOf("") }
    var startTime by remember { mutableStateOf("09:00") }
    var endTime by remember { mutableStateOf("10:30") }
    var category by remember { mutableStateOf("deep_work") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_timeblock_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "إضافة كتلة زمنية")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("timeblocking_screen"),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "⏳ الجدولة بالكتل الزمنية (Time Blocking)",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "قسّم يومك إلى فترات زمنية واضحة ومحددة: تركيز عميق، عبادات، عمل إجرائي، واجتماعات.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (blocks.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "لا توجد كتل زمنية مجدولة لليوم", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "اضغط على + لإضافة كتلة زمنية ليومك", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            items(blocks) { block ->
                TimeBlockCardItem(
                    block = block,
                    onToggle = { viewModel.toggleTimeBlock(block) },
                    onDelete = { viewModel.deleteTimeBlock(block.id) }
                )
            }
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("إضافة كتلة زمنية جديدة") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = blockTitle,
                        onValueChange = { blockTitle = it },
                        label = { Text("عنوان الكتلة (مثال: برمجة تطبيق دوّنلي)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = startTime,
                            onValueChange = { startTime = it },
                            label = { Text("البدء") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = endTime,
                            onValueChange = { endTime = it },
                            label = { Text("الانتهاء") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Text("النوع:", style = MaterialTheme.typography.labelMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            "deep_work" to "تركيز عميق",
                            "worship" to "عبادة",
                            "meeting" to "اجتماع"
                        ).forEach { (catKey, catLabel) ->
                            FilterChip(
                                selected = category == catKey,
                                onClick = { category = catKey },
                                label = { Text(catLabel) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (blockTitle.isNotBlank()) {
                            viewModel.addTimeBlock(blockTitle, startTime, endTime, category)
                            blockTitle = ""
                            showAddDialog = false
                        }
                    }
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
fun TimeBlockCardItem(
    block: TimeBlockEntity,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    val categoryColor = when (block.category) {
        "deep_work" -> EmeraldPrimaryLight
        "worship" -> GreenSuccess
        "meeting" -> PurpleAccent
        else -> MaterialTheme.colorScheme.primary
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (block.isCompleted) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
            else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Checkbox(
                    checked = block.isCompleted,
                    onCheckedChange = { onToggle() }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = block.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (block.isCompleted) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${block.startTime} — ${block.endTime}",
                        style = MaterialTheme.typography.bodySmall,
                        color = categoryColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            IconButton(onClick = onDelete) {
                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}
