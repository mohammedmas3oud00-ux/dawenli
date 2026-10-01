package com.example.dawenli.data.repository

import com.example.dawenli.data.local.DawenliDao
import com.example.dawenli.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import java.text.SimpleDateFormat
import java.util.*

class DawenliRepository(private val dao: DawenliDao) {

    val allPillars: Flow<List<PillarEntity>> = dao.getAllPillars()
    val allVisions: Flow<List<VisionEntity>> = dao.getAllVisions()
    val allGoals: Flow<List<ValueGoalEntity>> = dao.getAllGoals()
    val allProjects: Flow<List<ProjectEntity>> = dao.getAllProjects()
    val allTasks: Flow<List<TaskEntity>> = dao.getAllTasks()
    val allHabits: Flow<List<HabitEntity>> = dao.getAllHabits()
    val allInboxItems: Flow<List<InboxEntity>> = dao.getAllInboxItems()
    val allWorshipDefinitions: Flow<List<WorshipDefinitionEntity>> = dao.getAllWorshipDefinitions()
    val allReviews: Flow<List<SystemReviewEntity>> = dao.getAllReviews()
    val allFocusSessions: Flow<List<FocusSessionEntity>> = dao.getAllFocusSessions()
    val allJournals: Flow<List<JournalEntryEntity>> = dao.getAllJournals()
    val allVaultItems: Flow<List<VaultItemEntity>> = dao.getAllVaultItems()
    val allTimeBlocks: Flow<List<TimeBlockEntity>> = dao.getAllTimeBlocks()

    fun getTimeBlocksByDate(date: String): Flow<List<TimeBlockEntity>> = dao.getTimeBlocksByDate(date)

    fun getWorshipLogsByDate(date: String): Flow<List<WorshipLogEntity>> =
        dao.getWorshipLogsByDate(date)

    // --- HIERARCHICAL RECALCULATION LOGIC ---
    suspend fun recomputeAllProgress() {
        val tasks = dao.getAllTasks().first()
        val projects = dao.getAllProjects().first()
        val goals = dao.getAllGoals().first()
        val visions = dao.getAllVisions().first()
        val pillars = dao.getAllPillars().first()

        // 1. Projects progress from Tasks
        val updatedProjects = projects.map { project ->
            val pTasks = tasks.filter { it.projectId == project.id }
            val progress = if (pTasks.isNotEmpty()) {
                val doneCount = pTasks.count { it.status == "done" }
                Math.round((doneCount.toFloat() / pTasks.size) * 100)
            } else 0
            val status = if (progress >= 100) "completed" else if (progress > 0) "in_progress" else project.status
            project.copy(progress = progress, status = status)
        }
        dao.updateProjects(updatedProjects)

        // 2. Goals progress from Projects
        val updatedGoals = goals.map { goal ->
            val gProjects = updatedProjects.filter { it.goalId == goal.id }
            val progress = if (gProjects.isNotEmpty()) {
                Math.round(gProjects.sumOf { it.progress }.toFloat() / gProjects.size)
            } else 0
            val status = if (progress >= 100) "completed" else if (progress > 0) "in_progress" else goal.status
            goal.copy(progress = progress, status = status)
        }
        dao.updateGoals(updatedGoals)

        // 3. Visions progress from Goals
        val updatedVisions = visions.map { vision ->
            val vGoals = updatedGoals.filter { it.visionId == vision.id }
            val progress = if (vGoals.isNotEmpty()) {
                Math.round(vGoals.sumOf { it.progress }.toFloat() / vGoals.size)
            } else 0
            vision.copy(progress = progress)
        }
        dao.updateVisions(updatedVisions)

        // 4. Pillars progress from Visions & Direct Goals
        val updatedPillars = pillars.map { pillar ->
            val childrenProgress = mutableListOf<Int>()
            childrenProgress.addAll(updatedVisions.filter { it.pillarId == pillar.id }.map { it.progress })
            childrenProgress.addAll(updatedGoals.filter { it.pillarId == pillar.id && it.visionId == null }.map { it.progress })

            val progress = if (childrenProgress.isNotEmpty()) {
                Math.round(childrenProgress.sum().toFloat() / childrenProgress.size)
            } else 0
            pillar.copy(progress = progress)
        }
        dao.updatePillars(updatedPillars)
    }

    suspend fun insertTask(task: TaskEntity) {
        dao.insertTask(task)
        recomputeAllProgress()
    }

    suspend fun updateTask(task: TaskEntity) {
        dao.updateTask(task)
        recomputeAllProgress()
    }

    suspend fun deleteTask(taskId: String) {
        dao.deleteTaskById(taskId)
        recomputeAllProgress()
    }

    suspend fun insertProject(project: ProjectEntity) {
        dao.insertProject(project)
        recomputeAllProgress()
    }

    suspend fun insertGoal(goal: ValueGoalEntity) {
        dao.insertGoal(goal)
        recomputeAllProgress()
    }

    suspend fun insertVision(vision: VisionEntity) {
        dao.insertVision(vision)
        recomputeAllProgress()
    }

    suspend fun insertPillar(pillar: PillarEntity) {
        dao.insertPillar(pillar)
        recomputeAllProgress()
    }

    suspend fun toggleHabitForDate(habit: HabitEntity, dateStr: String) {
        val completedList = habit.completedDatesCsv.split(",").filter { it.isNotBlank() }.toMutableList()
        val isAlreadyDone = completedList.contains(dateStr)

        if (isAlreadyDone) {
            completedList.remove(dateStr)
        } else {
            completedList.add(dateStr)
        }

        val newStreak = if (isAlreadyDone) Math.max(0, habit.currentStreak - 1) else habit.currentStreak + 1
        val newLongest = Math.max(newStreak, habit.longestStreak)

        val updated = habit.copy(
            completedDatesCsv = completedList.joinToString(","),
            currentStreak = newStreak,
            longestStreak = newLongest
        )
        dao.updateHabit(updated)
    }

    suspend fun logWorship(worshipId: String, date: String, isCompleted: Boolean, performance: String? = null) {
        val log = WorshipLogEntity(
            id = "${worshipId}_$date",
            worshipId = worshipId,
            date = date,
            isCompleted = isCompleted,
            performance = performance
        )
        dao.insertWorshipLog(log)
    }

    suspend fun insertInboxItem(item: InboxEntity) = dao.insertInboxItem(item)
    suspend fun updateInboxItem(item: InboxEntity) = dao.updateInboxItem(item)
    suspend fun deleteInboxItem(id: String) = dao.deleteInboxItemById(id)

    suspend fun insertReview(review: SystemReviewEntity) = dao.insertReview(review)
    suspend fun insertFocusSession(session: FocusSessionEntity) = dao.insertFocusSession(session)
    suspend fun insertJournal(journal: JournalEntryEntity) = dao.insertJournal(journal)

    suspend fun insertTimeBlock(block: TimeBlockEntity) = dao.insertTimeBlock(block)
    suspend fun updateTimeBlock(block: TimeBlockEntity) = dao.updateTimeBlock(block)
    suspend fun deleteTimeBlock(id: String) = dao.deleteTimeBlockById(id)

    suspend fun insertVaultItem(item: VaultItemEntity) = dao.insertVaultItem(item)
    suspend fun updateVaultItem(item: VaultItemEntity) = dao.updateVaultItem(item)
    suspend fun deleteVaultItem(id: String) = dao.deleteVaultItemById(id)

    suspend fun seedInitialDataIfEmpty() {
        val existingPillars = dao.getAllPillars().first()
        if (existingPillars.isNotEmpty()) return

        val now = System.currentTimeMillis()

        // 1. Initial Pillars
        val p1 = PillarEntity("pillar-1", "العلاقة مع الله", "ركيزة العبادات والصلوات والأوراد الإيمانية وتزكية النفس", "Spirituality", "تقوية الصلة بالله سبحانه وتعالى في كل يوم", 1, true, "active", 45, now)
        val p2 = PillarEntity("pillar-2", "النمو المعرفي والمهني", "ركيزة التعلم المستمر واكتساب المهارات والإنتاجية العالية", "Growth", "الارتقاء المعرفي والاحترافي لتحقيق التميز والأثر", 2, true, "active", 30, now)
        val p3 = PillarEntity("pillar-3", "الصحة والنشاط البدني", "ركيزة العناية بالجسد واللياقة والتغذية السليمة والنوم المنتظم", "Vitality", "بناء جسد قوي سليم يعين على طاعة الله وتحقيق الأهداف", 3, true, "active", 60, now)
        val p4 = PillarEntity("pillar-4", "الأثر والمجتمع", "ركيزة الإحسان الأسري والمجتمعي وبناء العلاقات الإيجابية", "Community", "نفع الناس وترك بصمة طيبة في الأسرة والمحيط", 4, true, "active", 20, now)
        dao.insertPillars(listOf(p1, p2, p3, p4))

        // 2. Initial Visions
        val v1 = VisionEntity("vision-1", p1.id, "الاستقامة وحفظ القرآن", "إتقان تلاوة القرآن وتثبيت ورده اليومي والمحافظة على تكبيرة الإحرام", "2026-2028", "active", 50, now)
        val v2 = VisionEntity("vision-2", p2.id, "التميز القيادي والتقني", "بناء مشاريع برمجية رائدة وكتابة مقالات تخصصية", "2026-2027", "active", 30, now)
        dao.insertVisions(listOf(v1, v2))

        // 3. Initial Goals
        val g1 = ValueGoalEntity("goal-1", p1.id, v1.id, "إتمام ختمة قرآنية شهرية", "قراءة ربعين إلى حزب يوميًا بانتظام", "in_progress", "2026-12-31", 60, now)
        val g2 = ValueGoalEntity("goal-2", p2.id, v2.id, "إطلاق تطبيق دوّنلي للأندرويد", "تطوير التطبيق الكامل باستخدام Jetpack Compose", "in_progress", "2026-11-30", 75, now)
        dao.insertGoals(listOf(g1, g2))

        // 4. Initial Projects
        val proj1 = ProjectEntity("proj-1", g2.id, "تطوير واجهات وتجربة المستخدم M3", "تصميم الشاشات والمكونات وفق إرشادات Material Design 3", "in_progress", 80, "2026-10-01", "2026-10-15", now)
        val proj2 = ProjectEntity("proj-2", g1.id, "تثبيت ورد التلاوة الصباحي", "تخصيص 20 دقيقة بعد صلاة الفجر لقراءة الورد اليومي", "in_progress", 50, "2026-10-01", "2026-10-31", now)
        dao.insertProjects(listOf(proj1, proj2))

        // 5. Initial Tasks
        val t1 = TaskEntity("task-1", proj1.id, "تصميم لوحة التحكم الرئيسية والرئيسية الهرمية", "إبراز مواقيت الصلاة ونسب إنجاز الركائز ومهمة اليوم المركزية", "done", "high", null, now, 2.5, "high", now)
        val t2 = TaskEntity("task-2", proj1.id, "تطبيق قاعدة بيانات Room والمستودع", "تخزين المهام والمشاريع والعبادات والعادات تفاعليًا", "done", "high", null, now, 3.0, "high", now)
        val t3 = TaskEntity("task-3", proj1.id, "إضافة جلسة التركيز المؤقت ومؤقت الطماطم", "عداد زمني تفاعلي مع تتبع المشتتات والملاحظات", "in_progress", "medium", null, null, 1.5, "medium", now)
        val t4 = TaskEntity("task-4", proj2.id, "قراءة حزب اليوم من سورة البقرة", "تدبر الآيات وتدوين فائدة في اليوميات", "todo", "high", null, null, 0.5, "high", now)
        dao.insertTasks(listOf(t1, t2, t3, t4))

        // 6. Initial Habits
        val h1 = HabitEntity("habit-1", p1.id, "أذكار الصباح والمساء", "حفظ الأوراد وحضور القلب", "daily", 7, "morning", 5, 14, "", true, now)
        val h2 = HabitEntity("habit-2", p3.id, "شرب 3 لترات ماء", "الحفاظ على حيوية الجسم ونشاطه", "daily", 7, "anytime", 8, 20, "", true, now)
        val h3 = HabitEntity("habit-3", p2.id, "قراءة 30 دقيقة في كتاب نافع", "تنمية الملكة العلمية والمهنية", "weekdays", 5, "evening", 3, 10, "", true, now)
        dao.insertHabits(listOf(h1, h2, h3))

        // 7. Initial Worship Definitions
        val prayers = listOf(
            WorshipDefinitionEntity("w-fajr", p1.id, "صلاة الفجر", "salah", "multi_option", "fajr", null, null, true, 1, now),
            WorshipDefinitionEntity("w-dhuhr", p1.id, "صلاة الظهر", "salah", "multi_option", "dhuhr", null, null, true, 2, now),
            WorshipDefinitionEntity("w-asr", p1.id, "صلاة العصر", "salah", "multi_option", "asr", null, null, true, 3, now),
            WorshipDefinitionEntity("w-maghrib", p1.id, "صلاة المغرب", "salah", "multi_option", "maghrib", null, null, true, 4, now),
            WorshipDefinitionEntity("w-isha", p1.id, "صلاة العشاء", "salah", "multi_option", "isha", null, null, true, 5, now),
            WorshipDefinitionEntity("w-quran", p1.id, "ورد القرآن اليومي", "quran_wird", "pages", "morning", null, 2.5, true, 6, now),
            WorshipDefinitionEntity("w-adhkar-m", p1.id, "أذكار الصباح", "adhkar", "checkbox", "morning", null, null, true, 7, now),
            WorshipDefinitionEntity("w-adhkar-e", p1.id, "أذكار المساء", "adhkar", "checkbox", "evening", null, null, true, 8, now),
            WorshipDefinitionEntity("w-qiyam", p1.id, "قيام الليل والوتر", "qiyam", "multi_option", "night", 2, null, true, 9, now)
        )
        dao.insertWorshipDefinitions(prayers)

        // 8. Recompute hierarchy
        recomputeAllProgress()
    }
}
