<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $title;
    public $recipientName;
    public $bodyMessage;
    public $ticketSubject;

    /**
     * Create a new message instance.
     */
    public function __construct($title, $recipientName, $bodyMessage, $ticketSubject)
    {
        $this->title = $title;
        $this->recipientName = $recipientName;
        $this->bodyMessage = $bodyMessage;
        $this->ticketSubject = $ticketSubject;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket_notification',
            with: [
                'title' => $this->title,
                'recipientName' => $this->recipientName,
                'bodyMessage' => $this->bodyMessage,
                'ticketSubject' => $this->ticketSubject,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
