import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, FileText, TrendingUp } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    jobs: 0,
    candidates: 0,
    applications: 0,
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
      loadStats();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        loadStats();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async () => {
    const [jobsResult, candidatesResult, applicationsResult] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("candidates").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      jobs: jobsResult.count || 0,
      candidates: candidatesResult.count || 0,
      applications: applicationsResult.count || 0,
    });
  };

  if (!session) return null;

  const statCards = [
    { title: "Open Jobs", value: stats.jobs, icon: Briefcase, color: "text-primary" },
    { title: "Total Candidates", value: stats.candidates, icon: Users, color: "text-secondary" },
    { title: "Applications", value: stats.applications, icon: FileText, color: "text-success" },
    { title: "Success Rate", value: "85%", icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's an overview of your recruitment activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your recruitment activities will appear here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate("/jobs")}
                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">Create New Job</div>
                <div className="text-sm text-muted-foreground">Post a new job opening</div>
              </button>
              <button
                onClick={() => navigate("/candidates")}
                className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-medium">Add Candidate</div>
                <div className="text-sm text-muted-foreground">Import or add new candidates</div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;