<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Participant extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'event_id',
        'name',
        'job_title',
        'company',
        'email',
        'phone',
        'id_type',
        'employee_id',
        'category_id',
        'function_id',
        'nationality',
        'custom_fields',
    ];

    protected $casts = [
        'custom_fields' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function card()
    {
        return $this->hasOne(Card::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function masterFunction()
    {
        return $this->belongsTo(MasterFunction::class, 'function_id');
    }
}
