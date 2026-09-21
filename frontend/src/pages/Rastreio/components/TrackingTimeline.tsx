import React from 'react';
import { clsx } from 'clsx';
import { Check, CircleDashed, Circle } from 'lucide-react';
import type { TrackingEvent, TrackingStage } from '../../../types';
import { STAGE_LABELS, STAGE_ORDER } from '../../../types';

interface TrackingTimelineProps {
  currentStage: TrackingStage;
  events: TrackingEvent[];
}

export function TrackingTimeline({ currentStage, events }: TrackingTimelineProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="relative pl-4 sm:pl-6 py-4">
      {/* Vertical line connector */}
      <div className="absolute left-[27px] sm:left-[35px] top-8 bottom-8 w-px bg-border z-0" />

      <div className="space-y-8 relative z-10">
        {STAGE_ORDER.map((stage, index) => {
          const isCompleted = index < currentIndex || (index === currentIndex && stage === 'FINALIZADO');
          const isCurrent = index === currentIndex && stage !== 'FINALIZADO';
          const isPending = index > currentIndex;

          // Find event for this stage if it happened
          const event = events.find((e) => e.stage === stage);

          return (
            <div key={stage} className="flex gap-4 sm:gap-6">
              {/* Timeline dot */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-gold text-background flex items-center justify-center shadow-md">
                    <Check size={16} strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gold/20 border-2 border-gold text-gold flex items-center justify-center animate-pulse-soft">
                      <Circle size={12} fill="currentColor" />
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-card border-2 border-border text-text-muted flex items-center justify-center">
                    <CircleDashed size={16} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={clsx("flex-1 pb-2", isPending && "opacity-50")}>
                <h4 className={clsx(
                  "text-base font-semibold",
                  isCompleted ? "text-text-primary" : isCurrent ? "text-gold" : "text-text-muted"
                )}>
                  {STAGE_LABELS[stage]}
                </h4>
                
                {event ? (
                  <div className="mt-2 text-sm bg-card/50 border border-border/50 rounded-lg p-3 inline-block min-w-full sm:min-w-[300px]">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <span className="text-text-muted text-xs font-medium">
                        {new Date(event.recorded_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {event.recorded_by && (
                        <span className="text-xs bg-border/50 px-2 py-0.5 rounded text-text-muted">
                          {event.recorded_by}
                        </span>
                      )}
                    </div>
                    {event.notes ? (
                      <p className="text-text-primary mt-1.5 whitespace-pre-wrap">{event.notes}</p>
                    ) : (
                      <p className="text-text-muted italic mt-1.5">Nenhuma observação registrada.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted mt-1">
                    {isCurrent ? "Aguardando conclusão desta etapa." : "Etapa pendente."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
