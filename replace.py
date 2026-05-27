import sys
import re

file_path = 'mobile/src/screens/StudentHomeScreen.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<Text style={{fontSize: 30, marginBottom: 10}}>🏋️</Text>', '<Feather name="activity" size={32} color="#666" style={{ marginBottom: 12 }} />')
content = content.replace('<Text style={{fontSize: 12}}>⚡</Text>', '<Feather name="zap" size={12} color="#FF8C00" />')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated StudentHomeScreen.tsx")

# Now let's do NotificationsTab.tsx
notif_path = 'mobile/src/screens/tabs/NotificationsTab.tsx'
with open(notif_path, 'r', encoding='utf-8') as f:
    notif = f.read()

notif = notif.replace("import { View, Text", "import { Feather } from '@expo/vector-icons';\nimport { View, Text")
notif = notif.replace('<Text style={{fontSize: 16}}>🗑️</Text>', '<Feather name="trash-2" size={18} color="#EF4444" />')
notif = notif.replace('<Text style={s.dismissText}>✕</Text>', '<Feather name="x" size={12} color="#999" />')
notif = notif.replace('<Text style={{fontSize: 20}}>⚠</Text>', '<Feather name="alert-triangle" size={20} color="#FF8C00" />')
notif = notif.replace('<Text style={{fontSize: 20}}>🏋️</Text>', '<Feather name="activity" size={20} color="#3B82F6" />')

with open(notif_path, 'w', encoding='utf-8') as f:
    f.write(notif)
print("Updated NotificationsTab.tsx")

# Now PlansTab.tsx
plans_path = 'mobile/src/screens/tabs/PlansTab.tsx'
with open(plans_path, 'r', encoding='utf-8') as f:
    plans = f.read()
plans = plans.replace("import { View, Text", "import { Feather } from '@expo/vector-icons';\nimport { View, Text")
plans = plans.replace('<Text style={{fontSize: 14}}>✏️</Text>', '<Feather name="edit-2" size={16} color="#3B82F6" />')
plans = plans.replace('<Text style={{fontSize: 14}}>🗑️</Text>', '<Feather name="trash-2" size={16} color="#EF4444" />')
with open(plans_path, 'w', encoding='utf-8') as f:
    f.write(plans)

# StudentsTab.tsx
students_path = 'mobile/src/screens/tabs/StudentsTab.tsx'
with open(students_path, 'r', encoding='utf-8') as f:
    students = f.read()
students = students.replace("import { View, Text", "import { Feather } from '@expo/vector-icons';\nimport { View, Text")
students = students.replace('<Text style={{fontSize: 14}}>✏️</Text>', '<Feather name="edit-2" size={16} color="#3B82F6" />')
students = students.replace('<Text style={{fontSize: 14}}>🗑️</Text>', '<Feather name="trash-2" size={16} color="#EF4444" />')
with open(students_path, 'w', encoding='utf-8') as f:
    f.write(students)

# WorkoutsTab.tsx
workouts_path = 'mobile/src/screens/tabs/WorkoutsTab.tsx'
with open(workouts_path, 'r', encoding='utf-8') as f:
    workouts = f.read()
workouts = workouts.replace("import { View, Text", "import { Feather } from '@expo/vector-icons';\nimport { View, Text")
workouts = workouts.replace('<Text style={{ fontSize: 16 }}>🗑️</Text>', '<Feather name="trash-2" size={18} color="#EF4444" />')
workouts = workouts.replace('<Text style={{color: \'#EF4444\'}}>✕</Text>', '<Feather name="x" size={16} color="#EF4444" />')
with open(workouts_path, 'w', encoding='utf-8') as f:
    f.write(workouts)

