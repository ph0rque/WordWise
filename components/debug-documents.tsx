"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client"

export function DebugDocuments() {
  const [results, setResults] = useState<string[]>([])
  
  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testDatabaseAccess = async () => {
    setResults([])
    addResult("🔄 Starting database access test...")
    
    try {
      const supabase = getSupabaseClient()
      
      // Test 1: Get current user
      addResult("1️⃣ Testing user authentication...")
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        addResult(`❌ User auth error: ${userError.message}`)
        return
      }
      
      if (!userData.user) {
        addResult("❌ No authenticated user found")
        return
      }
      
      addResult(`✅ User authenticated: ${userData.user.email} (ID: ${userData.user.id})`)
      addResult(`📋 User role: ${userData.user.user_metadata?.role || 'No role set'}`)
      
      // Test 2: Check if we can access documents table at all
      addResult("2️⃣ Testing documents table access...")
      const { data: tableTest, error: tableError } = await supabase
        .from("documents")
        .select("count")
        .limit(1)
        
      if (tableError) {
        addResult(`❌ Cannot access documents table: ${tableError.message}`)
        return
      }
      
      addResult("✅ Documents table is accessible")
      
      // Test 3: Try to fetch ALL documents (to see what RLS allows)
      addResult("3️⃣ Testing RLS policies - fetching all documents...")
      const { data: allDocs, error: allError } = await supabase
        .from("documents")
        .select("id, user_id, title, created_at")
        
      if (allError) {
        addResult(`❌ Error fetching all documents: ${allError.message}`)
      } else {
        addResult(`✅ RLS allows access to ${allDocs?.length || 0} documents`)
        if (allDocs && allDocs.length > 0) {
          allDocs.forEach((doc, index) => {
            addResult(`📄 Doc ${index + 1}: "${doc.title}" (user_id: ${doc.user_id}, mine: ${doc.user_id === userData.user.id ? 'YES' : 'NO'})`)
          })
        }
      }
      
      // Test 4: Try to fetch documents with explicit user filter
      addResult("4️⃣ Testing explicit user filtering...")
      const { data: userDocs, error: userError2 } = await supabase
        .from("documents")
        .select("id, user_id, title, created_at")
        .eq("user_id", userData.user.id)
        
      if (userError2) {
        addResult(`❌ Error with user filter: ${userError2.message}`)
      } else {
        addResult(`✅ User filter returned ${userDocs?.length || 0} documents`)
        if (userDocs && userDocs.length > 0) {
          userDocs.forEach((doc, index) => {
            addResult(`📄 My Doc ${index + 1}: "${doc.title}" (created: ${new Date(doc.created_at).toLocaleDateString()})`)
          })
        }
      }
      
      // Test 5: Try to create a test document
      addResult("5️⃣ Testing document creation...")
      const testTitle = `Test Doc ${Date.now()}`
      const { data: newDoc, error: createError } = await supabase
        .from("documents")
        .insert({
          title: testTitle,
          content: "This is a test document",
          user_id: userData.user.id
        })
        .select()
        .single()
        
      if (createError) {
        addResult(`❌ Cannot create document: ${createError.message}`)
      } else {
        addResult(`✅ Created test document: "${newDoc.title}" (ID: ${newDoc.id})`)
        
        // Clean up - delete the test document
        await supabase.from("documents").delete().eq("id", newDoc.id)
        addResult("🧹 Cleaned up test document")
      }
      
    } catch (error) {
      addResult(`❌ Unexpected error: ${error}`)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Document Database Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testDatabaseAccess} className="w-full">
          Run Database Access Test
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 