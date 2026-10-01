package com.example.dawenli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.dawenli.data.model.VaultItemEntity
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.theme.GoldSecondaryLight

@Composable
fun VaultsScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val items by viewModel.vaultItems.collectAsState()
    val pillars by viewModel.pillars.collectAsState()

    var showAddDialog by remember { mutableStateOf(false) }
    var itemTitle by remember { mutableStateOf("") }
    var itemAuthor by remember { mutableStateOf("") }
    var itemTotalUnits by remember { mutableIntStateOf(200) }
    var itemType by remember { mutableStateOf("books") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_vault_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "إضافة مادة معرفية")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("vaults_screen"),
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
                            text = "📚 المخازن المعرفية والمكتبة",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "تتبع قراءاتك، ملخصات الكتب، الدورات التدريبية، ونقاط التعلم المستمر.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (items.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "لا توجد مواد معرفية مسجلة بعد", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "اضغط على + لإضافة كتاب أو دورة أو مرجع للمكتبة", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            items(items) { vault ->
                VaultCardItem(
                    item = vault,
                    onUpdateProgress = { newUnits -> viewModel.updateVaultProgress(vault, newUnits) },
                    onDelete = { viewModel.deleteVaultItem(vault.id) }
                )
            }
        }
    }

    if (showAddDialog) {
        val defaultPillarId = pillars.firstOrNull()?.id ?: "pillar-2"
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("إضافة كتاب أو دورة للمكتبة") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = itemTitle,
                        onValueChange = { itemTitle = it },
                        label = { Text("العنوان (مثال: كتاب العادات الذرية)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = itemAuthor,
                        onValueChange = { itemAuthor = it },
                        label = { Text("المؤلف أو المصدر") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = itemTotalUnits.toString(),
                        onValueChange = { itemTotalUnits = it.toIntOrNull() ?: 100 },
                        label = { Text("إجمالي الوحدات (صفحات / دروس)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (itemTitle.isNotBlank()) {
                            viewModel.addVaultItem(defaultPillarId, itemTitle, itemType, itemAuthor, itemTotalUnits)
                            itemTitle = ""
                            itemAuthor = ""
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
fun VaultCardItem(
    item: VaultItemEntity,
    onUpdateProgress: (Int) -> Unit,
    onDelete: () -> Unit
) {
    val progressPercent = if (item.totalUnits > 0) Math.round((item.completedUnits.toFloat() / item.totalUnits) * 100) else 0

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
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (item.author.isNotBlank()) {
                        Text(text = "المؤلف: ${item.author}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                IconButton(onClick = onDelete) {
                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "الإنجاز: ${item.completedUnits} من ${item.totalUnits}", style = MaterialTheme.typography.bodySmall)
                Text(text = "$progressPercent%", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }

            Spacer(modifier = Modifier.height(6.dp))

            LinearProgressIndicator(
                progress = { progressPercent / 100f },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilledTonalButton(
                    onClick = { onUpdateProgress(item.completedUnits + 10) },
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp)
                ) {
                    Text("+10 وحدات")
                }
                FilledTonalButton(
                    onClick = { onUpdateProgress(item.completedUnits + 25) },
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp)
                ) {
                    Text("+25 وحدة")
                }
            }
        }
    }
}
