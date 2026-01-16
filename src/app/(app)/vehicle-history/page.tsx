"use client";

import { useFormState, useFormStatus } from "react-dom";
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
import { getVehicleHistoryAnalysis } from "./actions";
import { AlertTriangle, Lightbulb, History, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Analyzing..." : "Analyze History"}
      <Sparkles className="ml-2 h-4 w-4" />
    </Button>
  );
}

export default function VehicleHistoryPage() {
  const { toast } = useToast();
  const initialState = { message: null, data: null };
  const [state, dispatch] = useFormState(getVehicleHistoryAnalysis, initialState);

   useEffect(() => {
    if (state.message && state.message !== "Analysis complete.") {
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
        <h1 className="text-3xl font-bold font-headline tracking-tight">Vehicle History Analysis</h1>
        <p className="text-muted-foreground">
          Let AI analyze a vehicle's history to predict future issues and recommend maintenance.
        </p>
      </div>

      <form action={dispatch}>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Service History</CardTitle>
            <CardDescription>
              Provide the vehicle's service records and any current symptoms.
            </Description>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicleHistory">Service History</Label>
              <Textarea
                id="vehicleHistory"
                name="vehicleHistory"
                placeholder="e.g., 2022-01-15: Oil change at 30,000 miles. 2023-05-20: Replaced front brake pads..."
                className="min-h-32 font-code"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentSymptoms">Current Symptoms (Optional)</Label>
              <Textarea
                id="currentSymptoms"
                name="currentSymptoms"
                placeholder="e.g., Slight vibration at high speeds."
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>

      {state.data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                AI Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{state.data.summary}</p>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Predicted Future Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{state.data.predictedIssues}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recommended Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{state.data.recommendedMaintenance}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
