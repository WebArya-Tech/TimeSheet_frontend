import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Edit, Tag, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

type Category = {
  id: string;
  category_name: string;
  allowed_on_weekend: boolean;
  allowed_on_holiday: boolean;
};
type Holiday = {
  id: string;
  holiday_name: string;
  holiday_date: string;
};

const CategoriesHolidays = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  const [newCategory, setNewCategory] = useState({
    category_name: "",
    allowed_on_weekend: false,
    allowed_on_holiday: false,
  });
  const [newHoliday, setNewHoliday] = useState({
    holiday_name: "",
    holiday_date: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, holRes] = await Promise.all([
        api.get<Category[]>("/categories"),
        api.get<Holiday[]>("/holidays"),
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setHolidays(Array.isArray(holRes.data) ? holRes.data : []);
    } catch (e: any) {
      toast({
        title: "Failed to load categories/holidays",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCategory = async () => {
    try {
      await api.post("/categories", newCategory);
      toast({ title: "Category added" });
      setNewCategory({ category_name: "", allowed_on_weekend: false, allowed_on_holiday: false });
      await loadData();
    } catch (e: any) {
      toast({ title: "Failed to add category", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const toggleCategory = async (c: Category, field: "allowed_on_weekend" | "allowed_on_holiday") => {
    try {
      await api.put(`/categories/${c.id}`, { [field]: !c[field] });
      await loadData();
    } catch (e: any) {
      toast({ title: "Failed to update category", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const createHoliday = async () => {
    try {
      await api.post("/holidays", newHoliday);
      toast({ title: "Holiday added" });
      setNewHoliday({ holiday_name: "", holiday_date: "" });
      await loadData();
    } catch (e: any) {
      toast({ title: "Failed to add holiday", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Categories & Holidays</h1>
        <p className="page-subheader mt-1">Manage non-project categories and company holidays</p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="rounded-xl bg-muted p-1">
          <TabsTrigger value="categories" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm"><Tag className="h-3.5 w-3.5" /> Categories</TabsTrigger>
          <TabsTrigger value="holidays" className="rounded-lg gap-1.5 data-[state=active]:shadow-sm"><CalendarDays className="h-3.5 w-3.5" /> Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5 rounded-xl gradient-primary text-primary-foreground shadow"><Plus className="h-4 w-4" /> Add Category</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-bold">Add Category</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category Name</Label><Input placeholder="Category name" className="rounded-xl h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category Name</Label><Input value={newCategory.category_name} onChange={(e) => setNewCategory((s) => ({ ...s, category_name: e.target.value }))} placeholder="Category name" className="rounded-xl h-10" /></div>
                  <div className="flex items-center justify-between py-1"><Label className="text-sm">Allowed on Weekend</Label><Switch checked={newCategory.allowed_on_weekend} onCheckedChange={(v) => setNewCategory((s) => ({ ...s, allowed_on_weekend: !!v }))} /></div>
                  <div className="flex items-center justify-between py-1"><Label className="text-sm">Allowed on Holiday</Label><Switch checked={newCategory.allowed_on_holiday} onCheckedChange={(v) => setNewCategory((s) => ({ ...s, allowed_on_holiday: !!v }))} /></div>
                  <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={createCategory}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading && <div className="text-sm text-muted-foreground">Loading categories…</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categories.map((c) => (
              <Card key={c.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold">{c.category_name}</p>
                        <StatusBadge status="Active" />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Edit className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span
                      onClick={() => toggleCategory(c, "allowed_on_weekend")}
                      className={`cursor-pointer text-[10px] font-semibold px-2 py-0.5 rounded-md ${c.allowed_on_weekend ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"}`}
                    >
                      Weekend {c.allowed_on_weekend ? "✓" : "✗"}
                    </span>
                    <span
                      onClick={() => toggleCategory(c, "allowed_on_holiday")}
                      className={`cursor-pointer text-[10px] font-semibold px-2 py-0.5 rounded-md ${c.allowed_on_holiday ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}
                    >
                      Holiday {c.allowed_on_holiday ? "✓" : "✗"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5 rounded-xl gradient-primary text-primary-foreground shadow"><Plus className="h-4 w-4" /> Add Holiday</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-bold">Add Holiday</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Holiday Name</Label><Input value={newHoliday.holiday_name} onChange={(e) => setNewHoliday((s) => ({ ...s, holiday_name: e.target.value }))} placeholder="Holiday name" className="rounded-xl h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</Label><Input type="date" value={newHoliday.holiday_date} onChange={(e) => setNewHoliday((s) => ({ ...s, holiday_date: e.target.value }))} className="rounded-xl h-10" /></div>
                  <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={createHoliday}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading && <div className="text-sm text-muted-foreground">Loading holidays…</div>}
          <div className="space-y-2">
            {holidays.map((h) => (
              <Card key={h.id} className="card-hover overflow-hidden">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{h.holiday_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.holiday_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "long" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-info/10 text-info">Global</span>
                    <Button variant="ghost" size="sm" className="rounded-lg"><Edit className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoriesHolidays;


