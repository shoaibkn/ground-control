"use client"

import React from "react"
import { useParams } from "next/navigation"
import { FormEditor } from "../../components/form-editor"

export default function EditFormPage() {
  const params = useParams()
  const formId = params.formId

  return <FormEditor formId={formId} />
}
