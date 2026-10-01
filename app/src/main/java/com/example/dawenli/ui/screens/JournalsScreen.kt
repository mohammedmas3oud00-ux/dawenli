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
import com.example.dawenli.data.model.JournalEntryEntity
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.theme.AmberAccent
import com.example.dawenli.ui.theme.GreenSuccess

@Composable
fun JournalsScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val entries by viewModel.journals.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var entryTitle by remember { mutableStateOf("") }
    var entryContent by remember { mutableStateOf("") }
    var entryMood by remember { mutableStateOf("good") }
    var entryTags by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_journal_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "كتابة خاطرة أو يوميات")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("journals_screen"),
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
                            text = "✍️ دفتر اليوميات والتأمل الذاتي",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "سجّل مشاعرك وأفكارك وخواطرك الإيمانية والعملية يومًا بيوم.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (entries.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "لا توجد تدوينات مسجلة في اليوميات", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "اضغط على + لتدوين خواطر وتأملات اليوم", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            items(entries) { entry ->
                JournalCardItem(entry = entry)
            }
        }
    }

    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("تدوين يوميات جديدة") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = entryTitle,
                        onValueChange = { entryTitle = it },
                        label = { Text("العنوان (مثال: تأملات في ختام الأسبوع)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = entryContent,
                        onValueChange = { entryContent = it },
                        label = { Text("النص والتفاصيل...") },
                        modifier = Modifier.fillMaxWidth().height(120.dp),
                        maxLines = 5
                    )
                    Text("المزاج والحالة النفسية:", style = MaterialTheme.typography.labelMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(
                            "great" to "😊 رائع",
                            "good" to "🙂 جيد",
                            "neutral" to "😐 عادي",
                            "difficult" to "😔 مرهق"
                        ).forEach { (mKey, mLabel) ->
                            FilterChip(
                                selected = entryMood == mKey,
                                onClick = { entryMood = mKey },
                                label = { Text(mLabel) }
                            )
                        }
                    }
                    OutlinedTextField(
                        value = entryTags,
                        onValueChange = { entryTags = it },
                        label = { Text("الوسوم (مفصولة بفاصلة)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (entryContent.isNotBlank()) {
                            viewModel.addJournalEntry(
                                if (entryTitle.isBlank()) "يوميات" else entryTitle,
                                entryContent,
                                entryMood,
                                entryTags
                            )
                            entryTitle = ""
                            entryContent = ""
                            entryTags = ""
                            showAddDialog = false
                        }
                    }
                ) {
                    Text("حفظ التدوينة")
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
fun JournalCardItem(entry: JournalEntryEntity) {
    val moodLabel = when (entry.mood) {
        "great" -> "😊 رائع"
        "good" -> "🙂 جيد"
        "neutral" -> "😐 عادي"
        "difficult" -> "😔 مرهق"
        else -> "🙂"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = entry.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        text = moodLabel,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "التاريخ: ${entry.entryDate}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            Spacer(modifier = Modifier.height(10.dp))
            Text(text = entry.content, style = MaterialTheme.typography.bodyMedium)

            if (entry.tagsCsv.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    entry.tagsCsv.split(",").map { it.trim() }.filter { it.isNotBlank() }.forEach { tag ->
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                        ) {
                            Text(
                                text = "#$tag",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
