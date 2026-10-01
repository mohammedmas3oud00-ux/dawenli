package com.example.dawenli

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.example.dawenli.ui.AppTab
import com.example.dawenli.ui.DawenliViewModel
import com.example.dawenli.ui.screens.*
import com.example.dawenli.ui.theme.DawenliTheme

class MainActivity : ComponentActivity() {
    private val viewModel: DawenliViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            DawenliTheme {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    val currentTab by viewModel.currentTab.collectAsState()
                    var showMoreMenu by remember { mutableStateOf(false) }

                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        topBar = {
                            TopAppBar(
                                title = {
                                    Text(
                                        text = "دوّنلي",
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleLarge
                                    )
                                },
                                actions = {
                                    IconButton(
                                        onClick = { viewModel.selectTab(AppTab.FOCUS) },
                                        modifier = Modifier.testTag("top_focus_btn")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.HourglassTop,
                                            contentDescription = "جلسة التركيز",
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                    IconButton(
                                        onClick = { showMoreMenu = true },
                                        modifier = Modifier.testTag("top_menu_btn")
                                    ) {
                                        Icon(imageVector = Icons.Default.MoreVert, contentDescription = "المزيد")
                                    }
                                    DropdownMenu(
                                        expanded = showMoreMenu,
                                        onDismissRequest = { showMoreMenu = false }
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("الكتل الزمنية (Time Blocking)") },
                                            onClick = {
                                                viewModel.selectTab(AppTab.TIMEBLOCKING)
                                                showMoreMenu = false
                                            },
                                            leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = null) }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("المخازن المعرفية والمكتبة") },
                                            onClick = {
                                                viewModel.selectTab(AppTab.VAULTS)
                                                showMoreMenu = false
                                            },
                                            leadingIcon = { Icon(Icons.Default.MenuBook, contentDescription = null) }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("دفتر اليوميات والتأمل") },
                                            onClick = {
                                                viewModel.selectTab(AppTab.JOURNALS)
                                                showMoreMenu = false
                                            },
                                            leadingIcon = { Icon(Icons.Default.EditNote, contentDescription = null) }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("جلسة تركيز مؤقتة") },
                                            onClick = {
                                                viewModel.selectTab(AppTab.FOCUS)
                                                showMoreMenu = false
                                            },
                                            leadingIcon = { Icon(Icons.Default.HourglassBottom, contentDescription = null) }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("المراجعات الدورية") },
                                            onClick = {
                                                viewModel.selectTab(AppTab.REVIEWS)
                                                showMoreMenu = false
                                            },
                                            leadingIcon = { Icon(Icons.Default.Assessment, contentDescription = null) }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("صندوق الأفكار السريع") },
                                            onClick = {
                                                viewModel.selectTab(AppTab.INBOX)
                                                showMoreMenu = false
                                            },
                                            leadingIcon = { Icon(Icons.Default.Inbox, contentDescription = null) }
                                        )
                                    }
                                },
                                colors = TopAppBarDefaults.topAppBarColors(
                                    containerColor = MaterialTheme.colorScheme.surface
                                )
                            )
                        },
                        bottomBar = {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface,
                                tonalElevation = 3.dp,
                                modifier = Modifier.testTag("bottom_nav_bar")
                            ) {
                                NavigationBarItem(
                                    selected = currentTab == AppTab.DASHBOARD,
                                    onClick = { viewModel.selectTab(AppTab.DASHBOARD) },
                                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "الرئيسية") },
                                    label = { Text("الرئيسية") },
                                    modifier = Modifier.testTag("nav_dashboard")
                                )
                                NavigationBarItem(
                                    selected = currentTab == AppTab.HIERARCHY,
                                    onClick = { viewModel.selectTab(AppTab.HIERARCHY) },
                                    icon = { Icon(Icons.Default.AccountTree, contentDescription = "المنظومة") },
                                    label = { Text("المنظومة") },
                                    modifier = Modifier.testTag("nav_hierarchy")
                                )
                                NavigationBarItem(
                                    selected = currentTab == AppTab.IBADAT,
                                    onClick = { viewModel.selectTab(AppTab.IBADAT) },
                                    icon = { Icon(Icons.Default.Mosque, contentDescription = "العبادات") },
                                    label = { Text("العبادات") },
                                    modifier = Modifier.testTag("nav_ibadat")
                                )
                                NavigationBarItem(
                                    selected = currentTab == AppTab.TASKS,
                                    onClick = { viewModel.selectTab(AppTab.TASKS) },
                                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "المهام") },
                                    label = { Text("المهام") },
                                    modifier = Modifier.testTag("nav_tasks")
                                )
                                NavigationBarItem(
                                    selected = currentTab == AppTab.HABITS,
                                    onClick = { viewModel.selectTab(AppTab.HABITS) },
                                    icon = { Icon(Icons.Default.LocalFireDepartment, contentDescription = "العادات") },
                                    label = { Text("العادات") },
                                    modifier = Modifier.testTag("nav_habits")
                                )
                            }
                        }
                    ) { innerPadding ->
                        val screenModifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)

                        when (currentTab) {
                            AppTab.DASHBOARD -> DashboardScreen(
                                viewModel = viewModel,
                                onNavigateTab = { viewModel.selectTab(it) },
                                modifier = screenModifier
                            )
                            AppTab.HIERARCHY -> HierarchyScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.IBADAT -> IbadatScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.TASKS -> TasksScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.HABITS -> HabitsScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.FOCUS -> FocusSessionScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.REVIEWS -> ReviewsScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.INBOX -> InboxScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.TIMEBLOCKING -> TimeBlockingScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.VAULTS -> VaultsScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                            AppTab.JOURNALS -> JournalsScreen(
                                viewModel = viewModel,
                                modifier = screenModifier
                            )
                        }
                    }
                }
            }
        }
    }
}
