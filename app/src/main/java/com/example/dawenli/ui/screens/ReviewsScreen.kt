package com.example.dawenli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.dawenli.data.model.SystemReviewEntity
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.theme.GoldSecondaryLight

@Composable
fun ReviewsScreen(
    viewModel: DawenliViewModel,
    modifier: Modifier = Modifier
) {
    val reviews by viewModel.reviews.collectAsState()
    var showReviewDialog by remember { mutableStateOf(false) }

    var wins by remember { mutableStateOf("") }
    var challenges by remember { mutableStateOf("") }
    var lessons by remember { mutableStateOf("") }
    var commitments by remember { mutableStateOf("") }
    var rating by remember { mutableIntStateOf(8) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showReviewDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White,
                modifier = Modifier.testTag("add_review_fab")
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = "مراجعة جديدة")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("reviews_screen"),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(text = "📊 منظومة المراجعة الدورية", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                                Text(text = "التأمل في الإنجازات والتعلم من التحديات وتجديد الالتزام", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = MaterialTheme.colorScheme.primary
                            ) {
                                Text(
                                    text = "صحة 88%",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
                                )
                            }
                        }
                    }
                }
            }

            if (reviews.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "لا توجد مراجعات مسجلة حتى الآن", style = MaterialTheme.typography.titleMedium)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "اضغط على زر + لبدء مراجعة أسبوعية أو شهرية شاملة", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            items(reviews) { review ->
                ReviewCardItem(review = review)
            }
        }
    }

    if (showReviewDialog) {
        AlertDialog(
            onDismissRequest = { showReviewDialog = false },
            title = { Text("مراجعة دورية جديدة") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = wins,
                        onValueChange = { wins = it },
                        label = { Text("أبرز الانتصارات والإنجازات") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = challenges,
                        onValueChange = { challenges = it },
                        label = { Text("التحديات والمعوقات") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = lessons,
                        onValueChange = { lessons = it },
                        label = { Text("الدروس المستفادة") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = commitments,
                        onValueChange = { commitments = it },
                        label = { Text("الالتزامات والأولويات القادمة") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.saveReview("weekly", "مراجعة دورية منتظمة", wins, challenges, lessons, commitments, rating)
                        wins = ""
                        challenges = ""
                        lessons = ""
                        commitments = ""
                        showReviewDialog = false
                    },
                    modifier = Modifier.testTag("confirm_review_btn")
                ) {
                    Text("حفظ المراجعة")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReviewDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun ReviewCardItem(review: SystemReviewEntity) {
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
                Text(text = review.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Star, contentDescription = "Rating", tint = GoldSecondaryLight, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "${review.rating}/10", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = "التاريخ: ${review.date} • التكرار: ${review.frequency}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

            if (review.wins.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(text = "🌟 الانتصارات:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Text(text = review.wins, style = MaterialTheme.typography.bodyMedium)
            }

            if (review.nextCommitments.isNotBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "🎯 الالتزامات القادمة:", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                Text(text = review.nextCommitments, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
