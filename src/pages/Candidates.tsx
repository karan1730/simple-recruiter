import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail, Phone, MapPin, Search, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  skills: string[] | null;
  experience_years: number | null;
  created_at: string;
}

const Candidates = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    linkedin_url: "",
    experience_years: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
      loadCandidates();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load candidates");
      return;
    }
    setCandidates(data || []);
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("candidates").insert({
      full_name: newCandidate.full_name,
      email: newCandidate.email,
      phone: newCandidate.phone || null,
      location: newCandidate.location || null,
      linkedin_url: newCandidate.linkedin_url || null,
      experience_years: newCandidate.experience_years ? parseInt(newCandidate.experience_years) : null,
    });

    if (error) {
      toast.error(error.message || "Failed to add candidate");
    } else {
      toast.success("Candidate added successfully!");
      setIsDialogOpen(false);
      setNewCandidate({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        linkedin_url: "",
        experience_years: "",
      });
      loadCandidates();
    }
    setLoading(false);
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.full_name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(search.toLowerCase()) ||
      candidate.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (!session) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Candidates</h1>
            <p className="text-muted-foreground mt-2">Manage your candidate database</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
                <DialogDescription>Add a candidate to your database</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCandidate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    required
                    value={newCandidate.full_name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      required
                      type="email"
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={newCandidate.phone}
                      onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={newCandidate.location}
                      onChange={(e) => setNewCandidate({ ...newCandidate, location: e.target.value })}
                      placeholder="New York, NY"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Experience (years)</label>
                    <Input
                      type="number"
                      value={newCandidate.experience_years}
                      onChange={(e) => setNewCandidate({ ...newCandidate, experience_years: e.target.value })}
                      placeholder="5"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    value={newCandidate.linkedin_url}
                    onChange={(e) => setNewCandidate({ ...newCandidate, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Adding..." : "Add Candidate"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, email, or location..."
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold">{candidate.full_name}</div>
                    {candidate.experience_years && (
                      <div className="text-sm text-muted-foreground font-normal mt-1">
                        {candidate.experience_years} years of experience
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`mailto:${candidate.email}`} className="hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`tel:${candidate.phone}`} className="hover:underline">
                        {candidate.phone}
                      </a>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {candidate.location}
                    </div>
                  )}
                  {candidate.resume_url && (
                    <div className="flex items-center text-sm">
                      <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-primary"
                      >
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No candidates found</p>
              <p className="text-sm text-muted-foreground">
                {search ? "Try adjusting your search" : "Add your first candidate"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Candidates;