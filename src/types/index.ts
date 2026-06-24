export type SourceRef = {
  sheetIndex: number;
  sheetTitle: string;
  row: number;
};

export type RouteId =
  | 'dashboard'
  | 'fat-loss'
  | 'muscle-gain'
  | 'training'
  | 'tools'
  | 'foods'
  | 'qa'
  | 'anatomy'
  | 'source';

export type RouteItem = {
  id: RouteId;
  hash: string;
  label: string;
  mark: string;
};

export type RouteConfig = RouteItem;

export type RouteDataPayload = Record<string, unknown> & {
  loadError?: Error;
};

export type RouteDataState<TPayload extends RouteDataPayload = RouteDataPayload> = {
  routeKey: RouteId | null;
  queryKey: string | null;
  payload: TPayload;
};

export type CoreData = {
  generatedAt: string;
  source: string;
  sheets: SheetInfo[];
  modules: ModuleInfo[];
  sheetCategories: SheetCategory[];
  counts: {
    dietPlans: number;
    trainingPlans: number;
    foods: number;
    qa: number;
  };
};

export type SheetInfo = {
  index: number;
  title: string;
  rows: number;
  cols: number;
};

export type ModuleInfo = {
  id: string;
  label: string;
  description: string;
};

export type SheetCategory = {
  index: number;
  title: string;
  displayTitle: string;
  moduleId: string;
  rows: number;
  cols: number;
};

export type DietPlan = {
  id: string;
  sheetIndex: number;
  title: string;
  goal: 'fat-loss' | 'muscle-gain';
  timing: string;
  summary: string;
  inputs: InputField[];
  trainingDayMeals?: MealRow[];
  restDayMeals?: MealRow[];
  mealTables?: MealTable[];
  sourceRefs: SourceRef[];
};

export type InputField = {
  label: string;
  detail: string;
};

export type MealRow = {
  row: number;
  text: string;
  sourceRefs: SourceRef[];
};

export type MealTable = {
  dayType: 'training' | 'rest' | 'daily';
  title: string;
  meals: Meal[];
};

export type Meal = {
  order: string;
  name: string;
  mealTypeLabel: string;
  carbPercent: number;
  proteinPercent: number;
  carbOptions: string[];
  proteinOptions: string[];
  fatNote: string;
  produceNote: string;
};

export type TrainingPlan = {
  id: string;
  sheetIndex: number;
  title: string;
  environment: string;
  splitType: string;
  info: TrainingInfo[];
  days: TrainingDay[];
};

export type TrainingInfo = {
  label: string;
  detail: string;
};

export type TrainingDay = {
  title: string;
  rationale: string;
  rows: TrainingRow[];
};

export type TrainingRow = {
  muscleGroup: string;
  setGuidance: string;
  exercise: string;
  shoulderJoint: string;
  elbowJoint: string;
  notes: string;
  sourceRefs: SourceRef[];
};

export type Food = {
  id: string;
  macroType: string;
  group: string;
  name: string;
  rate: string;
  giOrPosition: string;
  explanation: string;
  sourceRefs: SourceRef[];
};

export type QA = {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  sourceRefs: SourceRef[];
};

export type AnatomyData = {
  intro: IntroItem[];
  jointToMuscles: JointMuscle[];
  imageGalleries: ImageGallery[];
  muscleSections: MuscleSection[];
};

export type IntroItem = {
  title: string;
  body: string;
};

export type JointMuscle = {
  joint: string;
  movement: string;
  description: string;
  example: string;
  muscles: string[];
  sourceRefs: SourceRef[];
};

export type ImageGallery = {
  id: string;
  title: string;
  note: string;
  images: ImageItem[];
};

export type ImageItem = {
  src: string;
  label: string;
  anchor: string;
};

export type LightboxImage = ImageItem & {
  title: string;
};

export type LightboxState = LightboxImage | null;

export type MuscleSection = {
  title: string;
  rows: MuscleRow[];
};

export type MuscleRow = {
  joint: string;
  movement: string;
  description: string;
  targets: MuscleTarget[];
};

export type MuscleTarget = {
  muscle: string;
  item: string;
};

export type CardioEntry = {
  restingHeartRate: string;
  exerciseHeartRate: string;
  kcalPerKg: string;
};

export type OneRepMaxEntry = {
  author: string;
  expression: string;
  note: string;
};

export type DashboardSearch = {
  dietPlans: SearchDiet[];
  trainingPlans: SearchTrainingPlan[];
  foods: SearchFood[];
  qa: SearchQA[];
};

export type SearchDiet = {
  goal: string;
  title: string;
  sourceRefs: SourceRef[];
};

export type SearchTrainingPlan = {
  title: string;
  days: SearchTrainingDay[];
  sourceRefs: SourceRef[];
};

export type SearchTrainingDay = {
  title: string;
  sourceRefs: SourceRef[];
};

export type SearchFood = {
  name: string;
  rate: string;
  sourceRefs: SourceRef[];
};

export type SearchQA = {
  id: string;
  category: string;
  question: string;
  sourceRefs: SourceRef[];
};

export type SearchResult = {
  type: string;
  title: string;
  href: string;
  sourceRefs: SourceRef[];
};

export type Profile = {
  sex: string;
  height: string;
  weight: string;
  age: string;
  strengthCalories: string;
  cardioCalories: string;
};

export type DietProfile = Profile;

export type MealTarget = {
  carbTotal: number;
  proteinTotal: number;
  carb: number;
  protein: number;
};

export type FoodRateInfo = {
  mode: 'unit' | 'gram';
  rate: number;
  unit: string;
};

export type FoodConversionResult = {
  value: number;
  unit: string;
};

export type QuotaMatch = {
  trainingCarb?: number;
  restCarb?: number;
  dailyCarb?: number;
  protein: number;
  key: string;
  sex: string;
  noStrength: boolean;
  matchedHeight: number;
  matchedWeight: number;
  isExact: boolean;
};

export type NutritionMetrics = {
  bmiText: string;
  bmiLabel: string;
  goal: string;
  sex: string;
  height: number;
  weight: number;
  bmr: number;
  restingExpenditure: number;
  strengthCalories: number;
  cardioCalories: number;
  maintenanceCalories?: number;
  trainingMaintenanceCalories?: number;
  restMaintenanceCalories?: number;
  targetCalories?: number;
  trainingTargetCalories?: number;
  restTargetCalories?: number;
  primaryTargetCalories: number;
  quotaMatch: QuotaMatch | null;
  advice: string;
  targetWeightText: string;
  tdee?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  carbsRate?: number;
  restCarbsRate?: number;
  proteinRate?: number;
  fatRate?: number;
  trainingCarbs?: number;
  trainingProtein?: number;
  trainingFat?: number;
  restCarbs?: number;
  restProtein?: number;
  restFat?: number;
};

export type NutritionResult = NutritionMetrics;

export type DailyCalorieDayType = 'training' | 'rest' | 'daily';

export type DailyCalorieRecord = {
  date: string;
  intakeCalories: number;
  dayType: DailyCalorieDayType;
  tdee: number;
  deficit: number;
  createdAt: string;
  updatedAt: string;
};
