"use client";

import { useFormStatus } from "react-dom";
import { useActionState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getAIDiagnosis } from "./actions";
import { Progress } from "@/components/ui/progress";
import { Bot, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Diagnosing..." : "Run Diagnosis"}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function DiagnosticsPage() {
  const { toast } = useToast();
  const initialState = { message: null, data: null };
  const [state, dispatch] = useActionState(getAIDiagnosis, initialState);

  useEffect(() => {
    if (state.message && state.message !== "Diagnosis complete.") {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">AI Diagnostic Assistance</h1>
        <p className="text-muted-foreground">
          Describe the vehicle's symptoms to get an AI-powered diagnosis.
        </p>
      </div>

      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Symptoms</CardTitle>
            <CardDescription>
              Provide a detailed description of the issues and any relevant vehicle history.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea
                id="symptoms"
                name="symptoms"
                placeholder="e.g., Engine makes a knocking sound on startup, loses power when accelerating..."
                className="min-h-32"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicleHistory">Vehicle History (Optional)</Label>
              <Textarea
                id="vehicleHistory"
                name="vehicleHistory"
                placeholder="e.g., Last oil change 3 months ago, new spark plugs at 50,000 miles..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>

      {state.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              AI Diagnosis Result
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div>
              <h3 className="font-semibold mb-2">Diagnosis</h3>
              <p className="text-muted-foreground">{state.data.diagnosis}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Confidence Level</h3>
              <div className="flex items-center gap-2">
                <Progress value={state.data.confidenceLevel * 100} className="w-full" />
                <span className="font-mono text-sm font-semibold">
                  {(state.data.confidenceLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Recommended Actions</h3>
              <p className="text-muted-foreground">{state.data.recommendedActions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {state.message && state.message !== "Diagnosis complete." && !state.data &&(
          <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle />
                    An Error Occurred
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{state.message}</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
