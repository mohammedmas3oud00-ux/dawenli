package com.example.dawenli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.dawenli.data.model.InboxEntity
import com.example.dawenli.ui.DawenliViewModel

@Composable
fun InboxScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val items by viewModel.inboxItems.collectAsState()
    val projects by viewModel.projects.collectAsState()
    var quickInput by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
            .testTag("inbox_screen")
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "📥 صندوق الوارد السريع (GTD Inbox)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "التقط أي فكرة أو مهمة أو خاطرة فورًا دون تشتيت، ثم عالجها لاحقًا.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = quickInput,
                        onValueChange = { quickInput = it },
                        placeholder = { Text("اكتب فكرة سريعة هنا...") },
                        modifier = Modifier.weight(1f).testTag("inbox_quick_input"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            if (quickInput.isNotBlank()) {
                                viewModel.addInboxItem(quickInput, "", "idea")
                                quickInput = ""
                            }
                        },
                        modifier = Modifier.testTag("submit_inbox_btn")
                    ) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = "إرسال", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(items) { item ->
                InboxCardItem(
                    item = item,
                    onConvertToTask = {
                        val defaultProj = projects.firstOrNull()?.id ?: "proj-1"
                        viewModel.convertInboxToTask(item, defaultProj)
                    },
                    onDelete = { viewModel.deleteInboxItem(item.id) }
                )
            }
        }
    }
}

@Composable
fun InboxCardItem(
    item: InboxEntity,
    onConvertToTask: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = item.title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                if (item.content.isNotBlank()) {
                    Text(text = item.content, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (item.status == "processed") {
                    Text(text = "تم التحويل إلى مهمة ✓", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (item.status != "processed") {
                    FilledTonalButton(
                        onClick = onConvertToTask,
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Text("تحويل لمهمة", style = MaterialTheme.typography.labelSmall)
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
