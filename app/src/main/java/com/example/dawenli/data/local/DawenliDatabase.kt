package com.example.dawenli.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.dawenli.data.model.*

@Database(
    entities = [
        PillarEntity::class,
        VisionEntity::class,
        ValueGoalEntity::class,
        ProjectEntity::class,
        TaskEntity::class,
        HabitEntity::class,
        InboxEntity::class,
        WorshipDefinitionEntity::class,
        WorshipLogEntity::class,
        SystemReviewEntity::class,
        FocusSessionEntity::class,
        JournalEntryEntity::class,
        TimeBlockEntity::class,
        VaultItemEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class DawenliDatabase : RoomDatabase() {

    abstract fun dawenliDao(): DawenliDao

    companion object {
        @Volatile
        private var INSTANCE: DawenliDatabase? = null

        fun getDatabase(context: Context): DawenliDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    DawenliDatabase::class.java,
                    "dawenli_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
