{{/*
Release/chart naming
*/}}
{{- define "devpulse.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "devpulse.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "devpulse.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "devpulse.labels" -}}
helm.sh/chart: {{ include "devpulse.chart" . }}
{{ include "devpulse.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "devpulse.selectorLabels" -}}
app.kubernetes.io/name: {{ include "devpulse.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Component-specific names and selector labels.
Usage: {{ include "devpulse.frontend.fullname" . }}
*/}}
{{- define "devpulse.frontend.fullname" -}}
{{- printf "%s-frontend" (include "devpulse.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "devpulse.backend.fullname" -}}
{{- printf "%s-backend" (include "devpulse.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "devpulse.frontend.selectorLabels" -}}
{{ include "devpulse.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end -}}

{{- define "devpulse.backend.selectorLabels" -}}
{{ include "devpulse.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end -}}

{{/*
Name of the Secret holding env values. Either user-provided existingSecret
or the chart-created one.
*/}}
{{- define "devpulse.secretName" -}}
{{- if .Values.secret.existingSecret -}}
{{- .Values.secret.existingSecret -}}
{{- else -}}
{{- printf "%s-env" (include "devpulse.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
Name of the ConfigMap for non-secret backend env.
*/}}
{{- define "devpulse.configMapName" -}}
{{- printf "%s-env" (include "devpulse.backend.fullname" .) -}}
{{- end -}}

{{/*
ServiceAccount name.
*/}}
{{- define "devpulse.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "devpulse.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Image references. Tag falls back to `v<Chart.AppVersion>` when values.image.tag
is unset, so the chart and its images stay version-locked by default.
*/}}
{{- define "devpulse.imageTag" -}}
{{- if .Values.image.tag -}}
{{- .Values.image.tag -}}
{{- else -}}
{{- printf "v%s" .Chart.AppVersion -}}
{{- end -}}
{{- end -}}

{{- define "devpulse.frontend.image" -}}
{{- printf "%s/%s:%s" .Values.image.registry .Values.frontend.image.repository (include "devpulse.imageTag" .) -}}
{{- end -}}

{{- define "devpulse.backend.image" -}}
{{- printf "%s/%s:%s" .Values.image.registry .Values.backend.image.repository (include "devpulse.imageTag" .) -}}
{{- end -}}

{{/*
FRONTEND_BASE_URL default: scheme://ingress.host when ingress is enabled,
else falls back to auth.frontendBaseUrl as user-supplied.
*/}}
{{- define "devpulse.frontendBaseUrl" -}}
{{- if .Values.auth.frontendBaseUrl -}}
{{- .Values.auth.frontendBaseUrl -}}
{{- else if and .Values.ingress.enabled .Values.ingress.host -}}
{{- $scheme := "http" -}}
{{- if .Values.ingress.tls.enabled -}}{{- $scheme = "https" -}}{{- end -}}
{{- printf "%s://%s" $scheme .Values.ingress.host -}}
{{- end -}}
{{- end -}}
