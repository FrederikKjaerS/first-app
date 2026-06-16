import { useMemo, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Header } from "./components/Header";
import { InstallPrompt } from "./components/InstallPrompt";
import { Hero } from "./components/Hero";
import { RecipeGallery } from "./components/RecipeGallery";
import { WeekPlanner } from "./components/WeekPlanner";
import { PickerOverlay } from "./components/PickerOverlay";
import { SwipePlanner } from "./components/SwipePlanner";
import { RecipeChooser } from "./components/RecipeChooser";
import { AddRecipeDialog } from "./components/AddRecipeDialog";
import { AuthDialog } from "./components/AuthDialog";
import { ImportBanner } from "./components/ImportBanner";
import { PeoplePage } from "./pages/PeoplePage";
import { ProfilePage } from "./pages/ProfilePage";
import { useRecipes } from "./hooks/useRecipes";
import { useWeekPlan } from "./hooks/useWeekPlan";
import { useAuth } from "./hooks/useAuth";
import { useCloudRecipes } from "./cloud/useCloudRecipes";
import { useCloudWeekPlan } from "./cloud/useCloudWeekPlan";
import type { RecipesApi, WeekPlanApi } from "./dataApi";
import type { DayKey } from "./types";

export default function App() {
  const auth = useAuth();
  if (auth.loading) {
    return (
      <div className="splash" role="status">
        <span className="splash-pan">🍳</span> Varmer panden op…
      </div>
    );
  }
  return auth.user && auth.profile ? (
    <CloudApp key={auth.user.id} userId={auth.user.id} />
  ) : (
    <LocalApp />
  );
}

function LocalApp() {
  const recipesApi = useRecipes();
  const validIds = useMemo(
    () => new Set(recipesApi.recipes.map((r) => r.id)),
    [recipesApi.recipes],
  );
  const weekPlan = useWeekPlan(validIds);
  return <Shell recipesApi={recipesApi} weekPlan={weekPlan} />;
}

function CloudApp({ userId }: { readonly userId: string }) {
  const recipesApi = useCloudRecipes(userId);
  const validIds = useMemo(
    () => new Set(recipesApi.recipes.map((r) => r.id)),
    [recipesApi.recipes],
  );
  const weekPlan = useCloudWeekPlan(userId, validIds);

  if (recipesApi.loading || weekPlan.loading) {
    return (
      <div className="splash" role="status">
        <span className="splash-pan">🍳</span> Henter dine opskrifter…
      </div>
    );
  }
  return (
    <Shell
      recipesApi={recipesApi}
      weekPlan={weekPlan}
      cloudUserId={userId}
      cloudError={recipesApi.error}
      onRefresh={recipesApi.refresh}
    />
  );
}

type ShellProps = {
  readonly recipesApi: RecipesApi;
  readonly weekPlan: WeekPlanApi;
  readonly cloudUserId?: string;
  readonly cloudError?: string | null;
  readonly onRefresh?: () => void;
};

function Shell({ recipesApi, weekPlan, cloudUserId, cloudError, onRefresh }: ShellProps) {
  const navigate = useNavigate();
  const { recipes } = recipesApi;
  const validIds = useMemo(() => new Set(recipes.map((r) => r.id)), [recipes]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [swipeOpen, setSwipeOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [chooserDay, setChooserDay] = useState<DayKey | null>(null);

  return (
    <div className="app">
      <Header onAddRecipe={() => setAddOpen(true)} onAuth={() => setAuthOpen(true)} />
      <InstallPrompt />

      {cloudError && (
        <p className="cloud-error" role="alert">
          {cloudError}
        </p>
      )}

      {cloudUserId && onRefresh && (
        <ImportBanner userId={cloudUserId} onImported={onRefresh} />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero
                triedCount={recipesApi.tried.size}
                newCount={recipes.length - recipesApi.tried.size}
                onSpin={() => setPickerOpen(true)}
                onSwipe={() => setSwipeOpen(true)}
                onPlanWeek={() => navigate("/uge")}
              />
              <RecipeGallery
                recipesApi={recipesApi}
                plan={weekPlan.plan}
                onAssignDay={weekPlan.assign}
                onClearDay={weekPlan.clear}
              />
            </>
          }
        />
        <Route
          path="/uge"
          element={
            <WeekPlanner
              recipes={recipes}
              tried={recipesApi.tried}
              weekPlan={weekPlan}
              onChooseDay={setChooserDay}
              onSpin={() => setPickerOpen(true)}
              onSwipe={() => setSwipeOpen(true)}
            />
          }
        />
        <Route path="/folk" element={<PeoplePage onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="/u/:username" element={<ProfilePage onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="*" element={<p className="empty">Siden findes ikke — prøv forsiden.</p>} />
      </Routes>

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

      {swipeOpen && (
        <SwipePlanner
          recipes={recipes}
          tried={recipesApi.tried}
          favorites={recipesApi.favorites}
          weekPlan={weekPlan}
          onShowWeek={() => {
            setSwipeOpen(false);
            navigate("/uge");
          }}
          onClose={() => setSwipeOpen(false)}
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

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
