import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, HelpCircle, Tag, Hash } from 'lucide-react';
import { useQuizCreation } from '@/contexts/quiz-creation-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
const GeneralInfoForm = () => {
  const { formValues, register, errors, control, addTag, removeTag } = useQuizCreation();
  const [newTag, setNewTag] = useState('');
 
  return (
    <form className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='topic'>Quiz Topic</Label>
        <div className='relative'>
          <BookOpen
            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'
            size={18}
          />
          <Input
            id='topic'
            {...register('topic')}
            placeholder='Enter the main subject or theme of your quiz'
            className='pl-10'
          />
          {errors.topic && <p className='text-red-500'>{errors.topic.message}</p>}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Quiz Description</Label>
        <Textarea
          id='description'
          {...register('description')}
          placeholder='Provide a brief overview of what the quiz covers'
          rows={4}
        />
        {errors.description && <p className='text-red-500'>{errors.description.message}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='number'>Number of Questions</Label>
        <div className='relative'>
          <Hash
            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'
            size={18}
          />
          <Input
            type='number'
            id='number'
            {...register('number')}
            placeholder='How many AI-generated questions?'
            className='pl-10'
          />
          {errors.number && <p className='text-red-500'>{errors.number.message}</p>}
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='passingScore'>Passing Score (%)</Label>
        <Controller
          name='passingScore'
          control={control}
          render={({ field }) => (
            <Slider
              id='passingScore'
              min={0}
              max={100}
              step={5}
              value={[field.value]}
              onValueChange={(value) => field.onChange(value[0])}
              className='flex-grow'
            />
          )}
        />
        <p className='font-medium w-16 text-right'>{formValues.passingScore}%</p>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='showCorrectAnswers' className='flex items-center space-x-2'>
            <span>Show Correct Answers</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle size={16} className='text-gray-500' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Display correct answers between questions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Controller
            name='showCorrectAnswers'
            control={control}
            render={({ field }) => (
              <Switch
                id='showCorrectAnswers'
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      

      <div className='space-y-2'>
        <Label htmlFor='newTag'>Quiz Tags</Label>
        <div className='flex flex-wrap gap-2 mb-2'>
          {formValues.tags?.map((tag) => (
            <span
              key={tag}
              className='bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center'
            >
              {tag}
              <button
                type='button'
                onClick={() => removeTag(tag)}
                className='ml-1 text-blue-600 hover:text-blue-800'
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className='flex items-center space-x-2'>
          <Input
            id='newTag'
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder='Enter a tag'
            className='flex-grow'
          />
          <Button type='button' onClick={() => addTag(newTag)} size='sm'>
            <Tag size={16} className='mr-2' /> Add Tag
          </Button>
        </div>
      </div>
    </form>
  );
};

export default GeneralInfoForm;
