"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote, Users, BookOpen } from "lucide-react"

interface TestimonialsSectionProps {
  className?: string
}

export default function TestimonialsSection({ className }: TestimonialsSectionProps) {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "11th Grade Student",
      school: "Lincoln High School",
      type: "student",
      content: "WordWise helped me improve my essay grades from B- to A-. The AI tutor doesn't write for me but asks questions that help me think deeper about my arguments. The real-time grammar checking is amazing!",
      rating: 5,
      improvement: "Grade improved from B- to A-"
    },
    {
      id: 2,
      name: "Ms. Rodriguez",
      role: "English Teacher",
      school: "Washington High School",
      type: "educator",
      content: "The keystroke recording feature is incredible for ensuring academic integrity. I can see exactly how students develop their ideas and catch any concerning patterns. My students' writing has improved dramatically.",
      rating: 5,
      improvement: "Class average improved 1.2 grade levels"
    },
    {
      id: 3,
      name: "Marcus Thompson",
      role: "12th Grade Student", 
      school: "Roosevelt High School",
      type: "student",
      content: "I used to struggle with vocabulary and making my essays sound academic. WordWise suggests better words and explains why they work better. Now I feel confident about my college applications!",
      rating: 5,
      improvement: "SAT Writing score improved 150 points"
    },
    {
      id: 4,
      name: "Dr. Park",
      role: "Department Head",
      school: "Jefferson High School",
      type: "educator",
      content: "WordWise has transformed how we teach writing. The progress monitoring shows us exactly where each student needs help. The AI tutor maintains academic integrity while providing personalized support.",
      rating: 5,
      improvement: "92% of students showed measurable improvement"
    },
    {
      id: 5,
      name: "Emma Martinez",
      role: "10th Grade Student",
      school: "Kennedy High School",
      type: "student",
      content: "The explanations with each grammar correction help me actually learn the rules. I'm not just fixing mistakes - I'm understanding why they're wrong so I don't make them again.",
      rating: 5,
      improvement: "Grammar accuracy improved from 72% to 94%"
    },
    {
      id: 6,
      name: "Mr. Jackson",
      role: "AP English Teacher",
      school: "Madison High School",
      type: "educator",
      content: "What sets WordWise apart is how it guides students without doing the work for them. The AI tutor asks Socratic questions that develop critical thinking skills. Perfect for AP preparation.",
      rating: 5,
      improvement: "AP pass rate increased by 23%"
    }
  ]

  const studentTestimonials = testimonials.filter(t => t.type === "student")
  const educatorTestimonials = testimonials.filter(t => t.type === "educator")

  return (
    <section className={`py-20 bg-gradient-to-br from-blue-50 to-purple-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Star className="mr-2 h-4 w-4" />
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Students & Educators
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from real students and teachers who have transformed their writing experience with WordWise.
          </p>
        </div>

        {/* Student Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <BookOpen className="mr-2 h-4 w-4" />
              Student Success Stories
            </Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {studentTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-white/80 backdrop-blur-sm border-2 hover:border-blue-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  
                  <Quote className="h-6 w-6 text-gray-400 mb-3" />
                  
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                        <div className="text-gray-600 text-xs">{testimonial.role}</div>
                        <div className="text-gray-500 text-xs">{testimonial.school}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {testimonial.improvement}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Educator Testimonials */}
        <div>
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <Users className="mr-2 h-4 w-4" />
              Educator Impact
            </Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {educatorTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="bg-white/80 backdrop-blur-sm border-2 hover:border-purple-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  
                  <Quote className="h-6 w-6 text-gray-400 mb-3" />
                  
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                        <div className="text-gray-600 text-xs">{testimonial.role}</div>
                        <div className="text-gray-500 text-xs">{testimonial.school}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {testimonial.improvement}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl p-8 border">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600 text-sm">Students Helped</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">1,200+</div>
              <div className="text-gray-600 text-sm">Educators Using</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">89%</div>
              <div className="text-gray-600 text-sm">Grade Improvement</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">4.9/5</div>
              <div className="text-gray-600 text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 