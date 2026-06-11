import { useMemo, useState } from "react";
import { Header, type View } from "./components/Header";
import { Hero } from "./components/Hero";
import { RecipeGallery } from "./components/RecipeGallery";
import { WeekPlanner } from "./components/WeekPlanner";
import { PickerOverlay } from "./components/PickerOverlay";
import { RecipeChooser } from "./components/RecipeChooser";
import { AddRecipeDialog } from "./components/AddRecipeDialog";
import { useRecipes } from "./hooks/useRecipes";
import { useWeekPlan } from "./hooks/useWeekPlan";
import type { DayKey } from "./types";

export default function App() {
  const recipesApi = useRecipes();
  const { recipes } = recipesApi;

  const validIds = useMemo(
    () => new Set(recipes.map((r) => r.id)),
    [recipes],
  );
  const weekPlan = useWeekPlan(validIds);

  const [view, setView] = useState<View>("retter");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [chooserDay, setChooserDay] = useState<DayKey | null>(null);

  return (
    <div className="app">
      <Header
        view={view}
        onViewChange={setView}
        onAddRecipe={() => setAddOpen(true)}
      />

      {view === "retter" ? (
        <>
          <Hero
            triedCount={recipesApi.tried.size}
            newCount={recipes.length - recipesApi.tried.size}
            onSpin={() => setPickerOpen(true)}
            onPlanWeek={() => setView("uge")}
          />
          <RecipeGallery
            recipesApi={recipesApi}
            plan={weekPlan.plan}
            onAssignDay={weekPlan.assign}
            onClearDay={weekPlan.clear}
          />
        </>
      ) : (
        <WeekPlanner
          recipes={recipes}
          tried={recipesApi.tried}
          weekPlan={weekPlan}
          onChooseDay={setChooserDay}
          onSpin={() => setPickerOpen(true)}
        />
      )}

      <footer className="footer">
        <span className="footer-mark">Aftensmad</span>
        <span>· {recipes.length} retter i samlingen · velbekomme</span>
      </footer>

      {pickerOpen && (
        <PickerOverlay
          recipes={recipes}
          favorites={recipesApi.favorites}
          tried={recipesApi.tried}
          onAssignDay={weekPlan.assign}
          onClearDay={weekPlan.clear}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {chooserDay && (
        <RecipeChooser
          day={chooserDay}
          recipes={recipes}
          onSelect={(recipeId) => {
            weekPlan.assign(chooserDay, recipeId);
            setChooserDay(null);
          }}
          onClose={() => setChooserDay(null)}
        />
      )}

      {addOpen && (
        <AddRecipeDialog
          existingIds={validIds}
          onAdd={(recipe) => {
            recipesApi.addRecipe(recipe);
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
