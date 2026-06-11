const planFormat = {
  goal: "muscle_gain",

  plan: [
    {
      day: 1,
      focus: "Chest & Triceps",

      challenges: [
        {
          id: 1,
          title: "Push-up Burn",
          description: "Complete 50 push-ups throughout the day",
          type: "workout",
          target: 50,
          unit: "reps",
        },
        {
          id: 2,
          title: "Protein Hit",
          description: "Consume at least 120g of protein today",
          type: "nutrition",
          target: 120,
          unit: "grams",
        },
        {
          id: 3,
          title: "Hydration Check",
          description: "Drink 3 liters of water",
          type: "lifestyle",
          target: 3,
          unit: "liters",
        },

        {
          id: 4,
          title: "Daily Progress Photo",
          description:
            "Upload a photo to track your transformation and verify your effort",
          type: "photo",
        },
      ],

      workout: {
        type: "strength_training",
        warmup: [
          { name: "Jump Rope", duration: "3 min" },
          { name: "Arm Swings", duration: "2 min" },
        ],
        exercises: [
          { name: "Push-ups", sets: 3, reps: 15 },
          { name: "Dumbbell Press", sets: 4, reps: 10, load: "15 kg" },
          { name: "Tricep Dips", sets: 3, reps: 12 },
        ],
        cooldown: [
          { name: "Shoulder Stretch", duration: "1 min" },
          { name: "Deep Breathing", duration: "2 min" },
        ],
        notes: "Maintain moderate intensity. Rest 60-90s between sets.",
      },

      diet: {
        meals: [
          {
            name: "Breakfast",
            items: [
              {
                food: "Oatmeal with milk and banana",
                quantity: "1 bowl",
                description:
                  "Provides slow-digesting carbs and fiber for steady energy",
              },
              {
                food: "Boiled eggs",
                quantity: "2 pieces",
                description: "Rich in protein to support muscle recovery",
              },
            ],
          },
          {
            name: "Lunch",
            items: [
              {
                food: "Grilled chicken with brown rice and broccoli",
                quantity: "1 plate",
                description:
                  "Balanced meal with protein, complex carbs, and vitamins",
              },
            ],
          },
          {
            name: "Dinner",
            items: [
              {
                food: "Vegetable soup with lentils",
                quantity: "1 bowl",
                description:
                  "Light, protein-rich, and easy to digest before sleep",
              },
            ],
          },
        ],
        hydration: {
          goal: "3 liters/day",
          reminders: [
            "Drink 1 glass of water before each meal",
            "Add electrolytes after workout if needed",
          ],
        },
        suggestions: [
          "Add cottage cheese before bed for extra protein",
          "Try Greek yogurt as a mid-day snack",
          "Include seasonal fruits for variety",
        ],
        general_guidelines: [
          "Avoid sugary drinks and processed snacks",
          "Eat slowly and chew thoroughly",
          "Ensure adequate sleep for muscle recovery",
        ],
      },
    },
  ],
};

module.exports = planFormat;
